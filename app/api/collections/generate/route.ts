import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import Collection from "@/models/collection";
import Template from "@/models/template";
import { ITemplate } from "@/types/models";
import dbConnect from "@/lib/mongodb";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const categoryToTypeMap: Record<string, string> = {
  cover: "cover",
  about: "about",
  metrics: "metrics",
  problem: "problem",
  solution: "solution",
  results: "results",
  conclusion: "conclusion",
};

interface PageField {
  title: string;
  description: string;
}

interface SlideBase {
  category: string;
}

interface ProblemSlide extends SlideBase {
  problemTitle: string;
  problemPageFields: PageField[];
}

interface SolutionSlide extends SlideBase {
  solutionPageFields: PageField[];
}

interface ResultSlide extends SlideBase {
  resultPageFields: PageField[];
}

interface AboutSlide extends SlideBase {
  aboutTitle: string;
  aboutSubtext: string;
}

interface CoverSlide extends SlideBase {
  coverPageTitle: string;
}

interface MetricsSlide extends SlideBase {
  metricsPageFields: PageField[];
}

interface ConclusionSlide extends SlideBase {
  conclusionTitle: string;
  conclusionSubtext: string;
}

type Slide =
  | ProblemSlide
  | SolutionSlide
  | ResultSlide
  | AboutSlide
  | CoverSlide
  | MetricsSlide
  | ConclusionSlide;

const cleanHtml = (html: string) => html.replace(/<[^>]+>/g, "").trim();

// Simplified word count function - only counts key fields needed for prompting
const getSimplifiedWordCounts = (jsonData: Record<string, unknown>): string => {
  const counts: string[] = [];

  const processValue = (value: unknown, path: string) => {
    if (typeof value === "string") {
      const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 0) counts.push(`"${path}": ${wordCount} words`);
    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        processValue(item, `${path}[${idx}]`);
      });
    } else if (typeof value === "object" && value !== null) {
      Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
        processValue(val, path ? `${path}.${key}` : key);
      });
    }
  };

  processValue(jsonData, "");
  return counts.join("\n");
};

const generateJsonDataFromSlide = async (
  slide: Slide,
  template: ITemplate,
  companyLogo: string = "",
  accentColor: string = ""
): Promise<Record<string, unknown>> => {
  // Get simplified word counts - faster than the full analysis
  const wordCountsText = getSimplifiedWordCounts(template.jsonData);

  let promptContent = "";

  switch (slide.category) {
    case "problem":
      const problemSlide = slide as ProblemSlide;
      promptContent = `Title: ${cleanHtml(
        problemSlide.problemTitle
      )}\nProblems:\n${problemSlide.problemPageFields
        .map((p, i) => `${i + 1}. ${cleanHtml(p.title)} - ${p.description}`)
        .join("\n")}`;
      break;
    case "solution":
      const solutionSlide = slide as SolutionSlide;
      promptContent = `Solutions:\n${solutionSlide.solutionPageFields
        .map((s, i) => `${i + 1}. ${cleanHtml(s.title)} - ${s.description}`)
        .join("\n")}`;
      break;
    case "results":
      const resultSlide = slide as ResultSlide;
      promptContent = `Results:\n${resultSlide.resultPageFields
        .map((r, i) => `${i + 1}. ${cleanHtml(r.title)} - ${r.description}`)
        .join("\n")}`;
      break;
    case "about":
      const aboutSlide = slide as AboutSlide;
      promptContent = `About:\nTitle: ${cleanHtml(
        aboutSlide.aboutTitle
      )}\nSubtext: ${aboutSlide.aboutSubtext}`;
      break;
    case "cover":
      const coverSlide = slide as CoverSlide;
      promptContent = `Cover Page Title: ${cleanHtml(
        coverSlide.coverPageTitle
      )}`;
      break;
    case "metrics":
      const metricsSlide = slide as MetricsSlide;
      promptContent = `Metrics:\n${metricsSlide.metricsPageFields
        .map((m, i) => `${i + 1}. ${cleanHtml(m.title)} - ${m.description}`)
        .join("\n")}`;
      break;
    case "conclusion":
      const conclusionSlide = slide as ConclusionSlide;
      promptContent = `Conclusion:\nTitle: ${cleanHtml(
        conclusionSlide.conclusionTitle
      )}\nSubtext: ${cleanHtml(conclusionSlide.conclusionSubtext)}`;
      break;
    default:
      return {};
  }

  const basePrompt = `Generate JSON that matches this structure:\n${JSON.stringify(
    template.jsonData,
    null,
    2
  )}\n\nKey word counts:\n${wordCountsText}\n\nContent to use:\n${promptContent}\n\nCommon values to use if applicable:\n- companyLogo: ${companyLogo}\n- accentColor: ${accentColor}\n\nIf the JSON structure contains fields named 'companyLogo' or 'accentColor', use the provided values. Ensure your content respects the field word counts. Use simple language.`;

  try {
    // Use GPT-3.5-turbo instead of GPT-4 for faster responses
    const gptRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "Return valid JSON only. Match the template structure exactly. If the template has fields named 'companyLogo' or 'accentColor', use the provided values for these fields.",
        },
        { role: "user", content: basePrompt },
      ],
    });

    // Parse the generated JSON
    const generatedJson = JSON.parse(gptRes.choices[0].message.content || "{}");

    // Ensure companyLogo and accentColor are used if fields exist
    if (companyLogo && Object.keys(generatedJson).includes("companyLogo")) {
      generatedJson.companyLogo = companyLogo;
    }

    if (accentColor && Object.keys(generatedJson).includes("accentColor")) {
      generatedJson.accentColor = accentColor;
    }

    return generatedJson;
  } catch (err) {
    console.error("JSON generation error:", err);
    return {};
  }
};

// Ensure mongoose.models.Template exists to fix the MissingSchemaError
// This creates a reference that makes sure the Template model is loaded
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const templateModel = Template;

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { caseStudyId, collectionId } = await request.json();

    const PRODUCTION_URL = "https://api2.trustworthy.io/trustworthy";
    const STAGING_URL = "https://staging.api2.trustworthy.io/trustworthy";

    // Try production URL first
    let caseStudyRes = await fetch(
      `${PRODUCTION_URL}/case-studies/slides/${caseStudyId}`
    );

    // If production URL fails, try staging URL
    if (!caseStudyRes.ok) {
      console.log("Production URL failed, trying staging URL");
      caseStudyRes = await fetch(
        `${STAGING_URL}/case-studies/slides/${caseStudyId}`
      );
    }

    // Fetch collection data
    // @ts-expect-error - Mongoose typing issue
    const collection = await Collection.findById(collectionId).populate(
      "templateIds"
    );

    if (!caseStudyRes.ok) {
      console.error("Failed to fetch case study from both URLs", caseStudyRes);
      return NextResponse.json(
        { error: "Failed to fetch case study" },
        { status: 500 }
      );
    }

    const caseStudyJson = await caseStudyRes.json();

    const coverSlide = caseStudyJson.slides.find(
      (slide: Slide) => slide.category === "cover"
    );

    const companyLogo = coverSlide?.coverPageCompanyLogo || "";
    const accentColor = coverSlide?.coverColor || "";

    const templates = collection?.templateIds as ITemplate[];

    // Process all slides in parallel for major speed improvement
    const slidePromises = caseStudyJson.slides.map(async (slide: Slide) => {
      const type = categoryToTypeMap[slide.category];
      const template = templates.find((t) => t.type === type);

      if (!template) return [type, null];

      const jsonData = await generateJsonDataFromSlide(
        slide,
        template,
        companyLogo,
        accentColor
      );
      return [type, jsonData];
    });

    const slideResults = await Promise.all(slidePromises);

    // Convert results array to object
    const results: Record<string, Record<string, unknown>> = {};
    for (const [type, data] of slideResults) {
      if (type && data)
        results[type as string] = data as Record<string, unknown>;
    }

    return NextResponse.json({
      caseStudyId: caseStudyJson._id,
      generatedData: results,
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
}

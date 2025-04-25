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

// Function to count words in a JSON structure
const countWordsInJson = (
  json: Record<string, unknown>
): Record<string, number> => {
  const wordCounts: Record<string, number> = {};

  const countWordsInValue = (value: unknown): number => {
    if (typeof value === "string") {
      return value.trim().split(/\s+/).filter(Boolean).length;
    }
    return 0;
  };

  const processObject = (obj: Record<string, unknown>, prefix = ""): void => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        processObject(value as Record<string, unknown>, currentPath);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "object" && item !== null) {
            processObject(
              item as Record<string, unknown>,
              `${currentPath}[${index}]`
            );
          } else {
            const wordCount = countWordsInValue(item);
            if (wordCount > 0) {
              wordCounts[`${currentPath}[${index}]`] = wordCount;
            }
          }
        });
      } else {
        const wordCount = countWordsInValue(value);
        if (wordCount > 0) {
          wordCounts[currentPath] = wordCount;
        }
      }
    }
  };

  processObject(json);
  return wordCounts;
};

const generateJsonDataFromSlide = async (
  slide: Slide,
  template: ITemplate
): Promise<Record<string, unknown>> => {
  // Count words in the template JSON structure
  const wordCounts = countWordsInJson(template.jsonData);

  let basePrompt = `You are a JSON generator. Create data that matches this structure:\n\n${JSON.stringify(
    template.jsonData,
    null,
    2
  )}\n\nWord counts for each field in the template:\n${Object.entries(
    wordCounts
  )
    .map(([path, count]) => `"${path}": ${count} words`)
    .join(
      "\n"
    )}\n\nEnsure your generated content should not exceed the word count for each field. Use short sentences and simple language. Use short words.`;

  switch (slide.category) {
    case "problem":
      const problemSlide = slide as ProblemSlide;
      basePrompt += `\n\nSlide Title: ${cleanHtml(
        problemSlide.problemTitle
      )}\nProblems:\n${problemSlide.problemPageFields
        .map(
          (p: PageField, i: number) =>
            `${i + 1}. ${cleanHtml(p.title)} - ${p.description}`
        )
        .join("\n")}`;
      break;
    case "solution":
      const solutionSlide = slide as SolutionSlide;
      basePrompt += `\n\nSolutions:\n${solutionSlide.solutionPageFields
        .map(
          (s: PageField, i: number) =>
            `${i + 1}. ${cleanHtml(s.title)} - ${s.description}`
        )
        .join("\n")}`;
      break;
    case "results":
      const resultSlide = slide as ResultSlide;
      basePrompt += `\n\nResults:\n${resultSlide.resultPageFields
        .map(
          (r: PageField, i: number) =>
            `${i + 1}. ${cleanHtml(r.title)} - ${r.description}`
        )
        .join("\n")}`;
      break;
    case "about":
      const aboutSlide = slide as AboutSlide;
      basePrompt += `\n\nAbout:\nTitle: ${cleanHtml(
        aboutSlide.aboutTitle
      )}\nSubtext: ${aboutSlide.aboutSubtext}`;
      break;
    case "cover":
      const coverSlide = slide as CoverSlide;
      basePrompt += `\n\nCover Page Title: ${cleanHtml(
        coverSlide.coverPageTitle
      )}`;
      break;
    case "metrics":
      const metricsSlide = slide as MetricsSlide;
      basePrompt += `\n\nMetrics:\n${metricsSlide.metricsPageFields
        .map(
          (m: PageField, i: number) =>
            `${i + 1}. ${cleanHtml(m.title)} - ${m.description}`
        )
        .join("\n")}`;
      break;
    case "conclusion":
      const conclusionSlide = slide as ConclusionSlide;
      basePrompt += `\n\nConclusion:\nTitle: ${cleanHtml(
        conclusionSlide.conclusionTitle
      )}\nSubtext: ${cleanHtml(conclusionSlide.conclusionSubtext)}`;
      break;
    default:
      return {};
  }

  const gptRes = await openai.chat.completions.create({
    model: "gpt-4",
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content:
          "You generate JSON only. Strictly match the exact word count of each field in the template. This is critical - the word count for each field must be exactly the same as specified in the prompt.",
      },
      { role: "user", content: basePrompt },
    ],
  });

  try {
    console.log("Base prompt", basePrompt);
    return JSON.parse(gptRes.choices[0].message.content || "{}");
  } catch (err) {
    console.error("JSON Parse Error:", err);
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

    const caseStudyRes = await fetch(
      `https://staging.api.trustworthy.so/trustworthy/case-studies/slides/${caseStudyId}`
    );

    if (!caseStudyRes.ok) {
      console.error("Failed to fetch case study", caseStudyRes);
      return NextResponse.json(
        { error: "Failed to fetch case study" },
        { status: 500 }
      );
    }

    const caseStudyJson = await caseStudyRes.json();

    // Use type assertion to handle mongoose typing issues - cast to any to avoid TypeScript errors
    // @ts-expect-error - Mongoose typing issue
    const collection = await Collection.findById(collectionId);
    if (collection) {
      await collection.populate("templateIds");
    }
    const templates = collection?.templateIds as ITemplate[];

    const results: Record<string, Record<string, unknown>> = {};

    for (const slide of caseStudyJson.slides) {
      const type = categoryToTypeMap[slide.category];
      const template = templates.find((t) => t.type === type);
      if (!template) continue;

      const jsonData = await generateJsonDataFromSlide(slide, template);
      results[type] = jsonData;
    }

    return NextResponse.json({
      caseStudyId: caseStudyJson._id,
      generatedData: results,
    });
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
}

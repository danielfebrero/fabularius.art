import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  console.log("Revalidation request received");

  const secret = request.nextUrl.searchParams.get("secret");
  const tag = request.nextUrl.searchParams.get("tag");

  console.log("Revalidation params:", {
    hasSecret: !!secret,
    tag,
    envSecret: !!process.env.REVALIDATE_SECRET,
  });

  if (secret !== process.env.REVALIDATE_SECRET) {
    console.error("Invalid revalidation secret");
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  if (!tag) {
    console.error("Missing tag parameter");
    return NextResponse.json({ message: "Tag is required" }, { status: 400 });
  }

  try {
    console.log(`Revalidating tag: ${tag}`);
    revalidateTag(tag);
    console.log(`Successfully revalidated tag: ${tag}`);

    return NextResponse.json({ revalidated: true, now: Date.now(), tag });
  } catch (error) {
    console.error("Error during revalidation:", error);
    return NextResponse.json(
      { message: "Revalidation failed", error: String(error) },
      { status: 500 }
    );
  }
}

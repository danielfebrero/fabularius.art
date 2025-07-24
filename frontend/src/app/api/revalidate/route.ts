import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { locales } from "@/i18n";

export async function POST(request: NextRequest) {
  console.log("Revalidation request received");

  const secret = request.nextUrl.searchParams.get("secret");
  const tag = request.nextUrl.searchParams.get("tag");
  const path = request.nextUrl.searchParams.get("path");
  const type = request.nextUrl.searchParams.get("type") || "tag"; // 'tag', 'path', or 'homepage'

  console.log("Revalidation params:", {
    hasSecret: !!secret,
    tag,
    path,
    type,
    envSecret: !!process.env.REVALIDATE_SECRET,
  });

  if (secret !== process.env.REVALIDATE_SECRET) {
    console.error("Invalid revalidation secret");
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  try {
    if (type === "homepage" || (!tag && !path)) {
      // Revalidate homepage for all locales
      console.log("Revalidating homepage for all locales");
      revalidateTag("albums");
      revalidateTag("homepage");
      
      for (const locale of locales) {
        revalidatePath(`/${locale}`);
        console.log(`Revalidated path: /${locale}`);
      }
      
      return NextResponse.json({ 
        revalidated: true, 
        now: Date.now(), 
        type: "homepage",
        locales: locales 
      });
    }

    if (tag) {
      console.log(`Revalidating tag: ${tag}`);
      revalidateTag(tag);
      console.log(`Successfully revalidated tag: ${tag}`);
    }

    if (path) {
      console.log(`Revalidating path: ${path}`);
      revalidatePath(path);
      console.log(`Successfully revalidated path: ${path}`);
    }

    if (!tag && !path) {
      console.error("Missing tag or path parameter");
      return NextResponse.json({ message: "Tag or path is required" }, { status: 400 });
    }

    return NextResponse.json({ revalidated: true, now: Date.now(), tag, path });
  } catch (error) {
    console.error("Error during revalidation:", error);
    return NextResponse.json(
      { message: "Revalidation failed", error: String(error) },
      { status: 500 }
    );
  }
}

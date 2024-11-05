import { NextResponse } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";
import { AUDIO_ASSET_PREFIX, LOCAL_ASSET_DIRECTORY } from "@/src/utils/assets";

export const POST = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode." },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No files received." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = formData.get("filename") as string;

  try {
    await writeFile(
      path.join(
        process.cwd(),
        `public/${LOCAL_ASSET_DIRECTORY}${AUDIO_ASSET_PREFIX}${filename}`
      ),
      new Uint8Array(buffer)
    );
    return NextResponse.json({ Message: "Success", status: 201 });
  } catch (error) {
    console.log("Error occured ", error);
    return NextResponse.json({ Message: "Failed", status: 500 });
  }
};

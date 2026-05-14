import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3, BUCKET, BUCKET_URL } from "@/lib/s3";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

const IMAGE_EXTS = /\.(jpe?g|png|webp|gif|avif|svg)$/i;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefix = req.nextUrl.searchParams.get("prefix") ?? "";

  const result = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
    Delimiter: "/",
    MaxKeys: 500,
  }));

  const folders = (result.CommonPrefixes ?? [])
    .map((p) => ({ prefix: p.Prefix! }));

  const images = (result.Contents ?? [])
    .filter((obj) => obj.Key && IMAGE_EXTS.test(obj.Key))
    .map((obj) => ({ url: `${BUCKET_URL}/${obj.Key}`, key: obj.Key! }));

  return NextResponse.json({ folders, images });
}

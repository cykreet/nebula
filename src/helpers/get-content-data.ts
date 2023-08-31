import { MemoryMapCache } from "@sylo-digital/kas";
import { fetch } from "undici";
import { config } from "../config.js";

const CONTENTFUL_API_BASE = `https://cdn.contentful.com`;

export interface ContentfulReponses {
  total: number;
  skip: number;
  limit: number;
  items: ContentfulResponse[];
}

export interface ContentfulAssets {
  total: number;
  skip: number;
  limit: number;
  items: ContentfulAsset[];
}

export interface ContentfulAsset {
  fields: {
    title: string;
    description?: string;
    file: {
      contentType: string;
      fileName: string;
      url: string;
    };
  };
  sys: {
    id: string;
    type: "Asset";
  };
}

export interface ContentfulResponse {
  fields: {
    identifier: string;
    content: string;
    header?: string;
    footer?: string;
    interactionTitle?: string;
    interactionDescription?: string;
    interactionType?: "Buttons" | "List";
    listTitle?: string;
    interactions?: [
      {
        sys: {
          id: string;
        };
      }
    ];
    media?: {
      sys: {
        id: string;
      };
    };
  };
  sys: {
    id: string;
    createdAt: string;
    updatedAt: string;
    revision: number;
    contentType: {
      sys: {
        id: string;
      };
    };
  };
}

const responseCache = new MemoryMapCache("5m");

export async function getResponseData(): Promise<ContentfulResponse[] | undefined>;
export async function getResponseData(id: string, sys?: boolean): Promise<ContentfulResponse | undefined>;
export async function getResponseData(
  id?: string,
  sys: boolean = false
): Promise<ContentfulResponse | ContentfulResponse[] | undefined> {
  const data = await fetchResponseData();
  if (id) return data.items.find((item) => (sys ? item.sys.id === id : item.fields.identifier === id));
  if (!data.items) return;
  return data.items.filter((item) => item.sys.contentType.sys.id === "response");
}

export async function getAssetData(): Promise<ContentfulAsset[] | undefined>;
export async function getAssetData(id: string): Promise<ContentfulAsset | undefined>;
export async function getAssetData(id?: string): Promise<ContentfulAsset | ContentfulAsset[] | undefined> {
  const data = await fetchAssetData();
  if (id) return data.items.find((item) => item.sys.id === id);
  if (!data.items) return;
  return data.items.filter((item) => item.sys.type === "Asset");
}

async function fetchAssetData(): Promise<ContentfulAssets> {
  const cached = responseCache.get("assets");
  if (cached) return cached as ContentfulAssets;
  const assetsEndpoint = `${CONTENTFUL_API_BASE}/spaces/${config.contentful.spaceId}/environments/master/assets?access_token=${config.contentful.token}`;
  const contentfulResponse = await fetch(assetsEndpoint);
  const data = (await contentfulResponse.json()) as ContentfulAssets;
  responseCache.set("assets", data);
  return data;
}

async function fetchResponseData(): Promise<ContentfulReponses> {
  const cached = responseCache.get("responses");
  if (cached) return cached as ContentfulReponses;
  const entriesEndpoint = `${CONTENTFUL_API_BASE}/spaces/${config.contentful.spaceId}/environments/master/entries?access_token=${config.contentful.token}`;
  const contentfulResponse = await fetch(entriesEndpoint);
  const data = (await contentfulResponse.json()) as ContentfulReponses;
  responseCache.set("responses", data);
  return data;
}

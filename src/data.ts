import { z } from "zod";

export const AssetTypeSchema = z.literal("narration").or(z.literal("image")).or(z.literal("tiles"));

export const AssetReferenceSchema = z.string();

export const GalleryModelSchema = z.array(AssetReferenceSchema);

export const LatLngSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const PoiModelSchema = z.object({
  id: z.string(),
  title: z.string(),
  desc: z.string(),
  lat: z.number(),
  lng: z.number(),
  gallery: GalleryModelSchema,
  links: z.record(z.object({ href: z.string() })),
});

export const ControlPointModelSchema = z.object({
  type: z.literal("control"),
  id: z.string(),
  lat: z.number(),
  lng: z.number(),
  control: z.literal("route").or(z.literal("path")).or(z.literal("none")),
});

export const StopModelSchema = z.object({
  type: z.literal("stop"),
  id: z.string(),
  title: z.string(),
  desc: z.string(),
  lat: z.number(),
  lng: z.number(),
  trigger_radius: z.number(),
  control: z.literal("route").or(z.literal("path")).or(z.literal("none")),
  gallery: GalleryModelSchema,
  transcript: z.optional(AssetReferenceSchema),
  narration: z.optional(AssetReferenceSchema),
  links: z.record(z.object({ href: z.string() })),
});

export const TourModelSchema = z.object({
  type: z.literal("driving").or(z.literal("walking")),
  id: z.string(),
  title: z.string(),
  desc: z.string(),
  gallery: GalleryModelSchema,
  tiles: z.optional(AssetReferenceSchema),
  route: z.array(z.discriminatedUnion("type", [
    StopModelSchema,
    ControlPointModelSchema,
  ])),
  pois: z.array(PoiModelSchema),
  path: z.string(),
  links: z.record(z.object({ href: z.string() })),
});

export const ProjectModelSchema = z.object({
  originalId: z.string(),
  createDate: z.optional(z.coerce.date()),
  modifyDate: z.optional(z.coerce.date()),
  title: z.string(),
  tours: z.array(TourModelSchema),
  assets: z.record(AssetReferenceSchema, z.object({
    hash: z.string(),
    alt: z.string(),
    attrib: z.string(),
  })),
});

export type AssetType = z.infer<typeof AssetTypeSchema>;
export type AssetReference = z.infer<typeof AssetReferenceSchema>;
export type GalleryModel = z.infer<typeof GalleryModelSchema>;
export type LatLng = z.infer<typeof LatLngSchema>;
export type PoiModel = z.infer<typeof PoiModelSchema>;
export type ControlPointModel = z.infer<typeof ControlPointModelSchema>;
export type StopModel = z.infer<typeof StopModelSchema>;
export type TourModel = z.infer<typeof TourModelSchema>;
export type ProjectModel = z.infer<typeof ProjectModelSchema>;

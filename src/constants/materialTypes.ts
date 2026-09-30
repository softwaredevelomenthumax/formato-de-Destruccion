export const MATERIAL_TYPE_OPTIONS = [
  { value: "ROH", classification: "MP", label: "ROH = Materia prima", meaning: "Materia prima: insumos y sustancias que se utilizan para fabricar el producto." },
  { value: "FERT", classification: "PT", label: "FERT = Producto terminado", meaning: "Producto terminado: producto listo para comercialización o entrega." },
  { value: "HALB", classification: "ST", label: "HALB = Semiterminado", meaning: "Semiterminado: material que requiere una etapa adicional antes de convertirse en producto terminado." },
  { value: "VERP", classification: "ME", label: "VERP = Material de empaque", meaning: "Material de empaque: envases, etiquetas, blísteres y otros materiales de acondicionamiento." },
  { value: "UNBW", classification: "reactivos", label: "UNBW = Reactivo o material de laboratorio", meaning: "Reactivo o material de laboratorio: sustancias y materiales usados para análisis, control o referencia." },
  { value: "ZNBW", classification: "residuo_comun", label: "ZNBW = Residuos peligrosos comunes", meaning: "Residuos peligrosos comunes generados durante actividades operativas." },
  { value: "OTRO", classification: "otro", label: "Otro", meaning: "Tipo de material no incluido en las opciones anteriores." },
] as const;

export const normalizeMaterialType = (value: unknown) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "");
  const aliases: Record<string, string> = {
    ROH: "ROH",
    MATERIAPRIMA: "ROH",
    FERT: "FERT",
    PRODUCTOTERMINADO: "FERT",
    HALB: "HALB",
    SEMITERMINADO: "HALB",
    PRODUCTOSEMITERMINADO: "HALB",
    ME: "VERP",
    VERP: "VERP",
    ZEMB: "VERP",
    MATERIALEMPAQUE: "VERP",
    UNBW: "UNBW",
    REACTIVO: "UNBW",
    REACTIVOS: "UNBW",
    MATERIALDELABORATORIO: "UNBW",
    ZNBW: "ZNBW",
    OTRO: "OTRO",
  };
  return aliases[normalized] || String(value || "").trim().toUpperCase();
};
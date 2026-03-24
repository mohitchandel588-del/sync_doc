export const emptyDocumentContent = {
  type: "doc",
  content: [
    {
      type: "paragraph"
    }
  ]
};

export const normalizeContent = (content: unknown) => {
  if (!content || typeof content !== "object") {
    return emptyDocumentContent;
  }

  return content;
};


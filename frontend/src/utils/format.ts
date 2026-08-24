export const formatYear = () => new Date().getFullYear();

export const formatDate = (date: string | null) => {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "long",
  }).format(new Date(date));
};

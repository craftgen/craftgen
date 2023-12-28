import slug from "slugify";

export const slugify = (str: string, replacement = "-") => {
  return slug(str, {
    remove: /[*+~.()'"!:@]/g,
    replacement,
    lower: true,
  });
};

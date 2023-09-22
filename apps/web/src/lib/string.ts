import slug from "slugify";

export const slugify = (str: string) => {
  return slug(str, {
    remove: /[*+~.()'"!:@]/g,
  });
};

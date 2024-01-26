export function extractOwnerAndName(
  input: string,
): { owner: string; name: string } | null {
  const regex = /(?<owner>[\w\-]+)\/(?<name>[\w\-]+)/;
  const match = input.match(regex);

  if (match && match.groups) {
    return {
      owner: match.groups.owner!,
      name: match.groups.name!,
    };
  } else {
    return null; // or handle the case where the input doesn't match the pattern
  }
}

export function extractOwnerAndNameAndVersion(
  input: string,
): { owner: string; name: string; version: string } | null {
  const regex = /(?<owner>[\w\-]+)\/(?<name>[\w\-]+):(?<version>[\w\-]+)/;
  const match = input.match(regex);

  if (match && match.groups) {
    return {
      owner: match.groups.owner!,
      name: match.groups.name!,
      version: match.groups.version!,
    };
  } else {
    return null; // or handle the case where the input doesn't match the pattern
  }
}

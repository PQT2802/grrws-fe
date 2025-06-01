export const getFirebaseImageUrls = async (
  imagePaths: string[]
): Promise<string[]> => {
  // For public Firebase Storage, construct URLs directly
  return imagePaths.map((path) => {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    const encodedPath = encodeURIComponent(path);
    return `https://firebasestorage.googleapis.com/v0/b/koiveterinaryservicecent-925db.appspot.com/o/${encodedPath}?alt=media`;
  });
};

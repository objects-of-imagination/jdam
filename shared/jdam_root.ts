export default function jdamRoot(currentPath: string, resolve: (...paths: string[]) => string, exists: (path: string) => boolean, sep = '/') {
  let path = resolve(currentPath)
  
  const recurse = (path: string): string | undefined => {
    const gitfile = '.git'
    if (!exists(resolve(path, gitfile))) {
      const parentDir = path.split(sep).slice(0, -1)
      if (!parentDir.length) { return }
      return recurse(parentDir.join(sep))
    }
    return path
  }

  const result = recurse(path)
  return result || currentPath

}

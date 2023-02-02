import FileFormat from '@sketch-hq/sketch-file-format-ts'
import JSZip from "jszip"

const readJsonFile = async (zipFile: JSZip, filename: string) => {
  const docStr = await zipFile.file(filename)?.async('string')
  return JSON.parse(docStr || '')
}

/**
 * Reads and parses Sketch documents.
 *
 * @param filepath - The file path to the Sketch document
 * @returns A {@link Promise} that resolves with a fully parsed {@link SketchFile} object once the file at the given path has been unzipped and read successfully
 */
const fromFile = async (filepath: string): Promise<SketchFile> => {
  const res = await fetch(filepath)
  if (res.status !== 200) {
    new Error('Load sketch file error: ' + res.status + ':' + res.statusText)
  }
  const zipFile = await JSZip.loadAsync(res.arrayBuffer())
  const document = await readJsonFile(zipFile, 'document.json')
  const pages = []
  for (let i = 0; i < document.pages.length; i++) {
    const pageInfo = document.pages[i]
    pages.push(await readJsonFile(zipFile, pageInfo._ref + '.json'))
  }
  const meta = await readJsonFile(zipFile, 'meta.json')
  const user = await readJsonFile(zipFile, 'user.json')

  const contents: FileFormat.Contents = {
    document: {
      ...document,
      pages,
    },
    meta,
    user
  }

  return { filepath, contents }
}

/**
 * Saves a valid Sketch document.
 *
 * @param obj - The {@link SketchFile} object to be saved.
 * @returns A void Promise
 */
// const toFile = async (obj: SketchFile): Promise<void> => {
//   await new Promise((resolve, reject): void => {
//     const sketch = new Zip()
//
//     // Write pages first and use the resulting paths for the file
//     // references that are stored within the main document.json.
//     const refs = obj.contents.document.pages.map((page): FileFormat.FileRef => {
//       const p = JSON.stringify(page)
//       sketch.addFile(
//         path.join('pages', `${page.do_objectID}.json`),
//         Buffer.alloc(Buffer.byteLength(p), p),
//         `page data for: ${page.name}`,
//       )
//
//       return {
//         _class: 'MSJSONFileReference',
//         _ref_class: 'MSImmutablePage',
//         _ref: `pages/${page.do_objectID}`,
//       }
//     })
//
//     // Store workspace data
//     Object.keys(obj.contents.workspace).map((key) => {
//       const p = JSON.stringify(obj.contents.workspace[key])
//       sketch.addFile(
//         path.join('workspace', `${key}.json`),
//         Buffer.alloc(Buffer.byteLength(p), p),
//         `workspace data for: ${key}`,
//       )
//     })
//
//     const data = {
//       document: JSON.stringify(<FileFormat.Document>{
//         ...obj.contents.document,
//         pages: refs,
//       }),
//       user: JSON.stringify(obj.contents.user),
//       meta: JSON.stringify(obj.contents.meta),
//     }
//
//     Object.entries(data).map(([key, val]) => {
//       sketch.addFile(
//         `${key}.json`,
//         Buffer.alloc(Buffer.byteLength(val), val),
//         `${key} data`,
//       )
//     })
//
//     sketch.writeZip(obj.filepath, (err) => {
//       if (err) {
//         reject(err)
//         return
//       }
//       resolve(null)
//     })
//   })
// }

/**
 * Represents a Sketch file that is (or will be) on disk. Collates the
 * filepath with an object typed as Contents from the file format.
 */
type SketchFile = {
  filepath: string
  contents: FileFormat.Contents
}

export {fromFile}
export type { SketchFile }


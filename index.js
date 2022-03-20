import {selectAll} from 'hast-util-select'
import probe from 'probe-image-size'

function isImageNode(node) {
  return (
    node.type === 'element' &&
    node.tagName === 'img' &&
    node.properties &&
    typeof node.properties.src === 'string'
  )
}

function setAbsolutePath(node, baseUrl) {
  if (node.properties.src.startsWith('/')) {
    if (!baseUrl) {
      throw new Error(
        `Error: [rehype-external-img-size] You must configure the baseUrl option to process relative img paths like: ${node.properties.src}`
      )
    }

    node.properties.src = baseUrl + node.properties.src
  }
}

const rehypeExternalImageSize = (options) => async (tree) => {
  const options_ = options || {}
  const baseUrl = options_.baseUrl

  const imageNodes = selectAll('img', tree)

  const validImageNodes = imageNodes.filter((node) => isImageNode(node))

  for (const node of validImageNodes) {
    setAbsolutePath(node, baseUrl)
  }

  await Promise.all(
    validImageNodes.map(async (node) => {
      try {
        const dimensions = (await probe(node.properties.src, baseUrl)) || {}
        node.properties.width = dimensions.width
        node.properties.height = dimensions.height
      } catch (error) {
        console.log(
          `Error: [rehype-external-img-size] error getting the dimensions of: ${node.properties.src}`,
          error
        )
        throw new Error(
          `Error: [rehype-external-img-size] error getting the dimensions of: ${node.properties.src}`
        )
      }
    })
  )
}

export default rehypeExternalImageSize

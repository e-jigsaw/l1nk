import { Schema } from 'prosemirror-model'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror'
import * as Y from 'yjs'

const schema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks,
})

export function extractTextFromYDoc(ydoc: Y.Doc): string {
  try {
    const fragment = ydoc.getXmlFragment('default')
    const doc = yXmlFragmentToProseMirrorRootNode(fragment, schema)
    
    // textContent の代わりに textBetween を使い、ブロックの区切りに改行を入れる
    return doc.textBetween(0, doc.content.size, '\n') || ""
  } catch (e) {
    console.error('Failed to parse Yjs doc', e)
    return ""
  }
}
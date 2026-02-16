import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const BracketLinkDecoration = Extension.create({
  name: 'bracketLinkDecoration',

  addKeyboardShortcuts() {
    return {
      '[': ({ editor }) => {
        const { selection } = editor.state
        if (selection.empty) return false
        const text = editor.state.doc.textBetween(selection.from, selection.to)
        editor.chain().focus().insertContent(`[${text}]`).run()
        return true
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('bracketLinkDecoration'),
        props: {
          decorations: (state) => {
            const { doc, selection } = state
            const decorations: Decoration[] = []

            const activeLinePos = selection.$from.before(1)
            const activeLineEnd = selection.$from.after(1)

            doc.descendants((node, pos) => {
              if (!node.isText) return

              const text = node.text || ''
              const regex = /\[([^\]]+)\]/g
              let match

              while ((match = regex.exec(text)) !== null) {
                const start = pos + match.index
                const end = start + match[0].length
                const isInsideActiveLine = start >= activeLinePos && end <= activeLineEnd

                if (!isInsideActiveLine) {
                  // ブラケット始まり '['
                  decorations.push(
                    Decoration.inline(start, start + 1, {
                      class: 'opacity-0 text-[0px]', // 完全に消す
                    })
                  )
                  // 中身 'text'
                  decorations.push(
                    Decoration.inline(start + 1, end - 1, {
                      class: 'text-indigo-600 font-semibold cursor-pointer hover:underline',
                      'data-href': match[1].toLowerCase().replace(/\s+/g, '-'),
                    })
                  )
                  // ブラケット終わり ']'
                  decorations.push(
                    Decoration.inline(end - 1, end, {
                      class: 'opacity-0 text-[0px]', // 完全に消す
                    })
                  )
                }
              }
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})
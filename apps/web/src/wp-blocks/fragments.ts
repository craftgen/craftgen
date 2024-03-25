import { graphql } from "gql.tada";

const editorBlocks = {
  CoreParagraph: {
    key: "CoreParagraphBlockFragment",
    entry: graphql(`
      fragment CoreParagraphBlockFragment on CoreParagraph {
        attributes {
          content
          dropCap
          fontSize
          textColor
          backgroundColor
          gradient
          align
          anchor
          className
          style
        }
      }
    `),
  },
  CoreColumns: {
    key: "CoreColumnsBlockFragment",
    entry: graphql(`
      fragment CoreColumnsBlockFragment on CoreColumns {
        attributes {
          align
          anchor
          layout
          cssClassName
          isStackedOnMobile
          verticalAlignment
          borderColor
          backgroundColor
          fontSize
          fontFamily
          style
          textColor
          gradient
        }
      }
    `),
  },
  CoreColumn: {
    key: "CoreColumnBlockFragment",
    entry: graphql(`
      fragment CoreColumnBlockFragment on CoreColumn {
        attributes {
          anchor
          borderColor
          backgroundColor
          cssClassName
          fontSize
          fontFamily
          gradient
          layout
          style
          textColor
          verticalAlignment
          width
        }
      }
    `),
  },
  CoreCode: {
    key: "CoreCodeBlockFragment",
    entry: graphql(`
      fragment CoreCodeBlockFragment on CoreCode {
        attributes {
          anchor
          backgroundColor
          borderColor
          className
          content
          cssClassName
          fontFamily
          fontSize
          gradient
          lock
          style
          textColor
        }
      }
    `),
  },
  // CoreQuote: CoreBlocks.CoreQuote,
  // CoreImage: CoreBlocks.CoreImage,
  // CoreSeparator: CoreBlocks.CoreSeparator,
  // CoreList: CoreBlocks.CoreList,
  // CoreButton: CoreBlocks.CoreButton,
  // CoreButtons: CoreBlocks.CoreButtons,
  CoreHeading: {
    key: "CoreHeadingBlockFragment",
    entry: graphql(`
      fragment CoreHeadingBlockFragment on CoreHeading {
        attributes {
          align
          anchor
          backgroundColor
          content
          fontFamily
          fontSize
          gradient
          level
          style
          textAlign
          textColor
          cssClassName
        }
      }
    `),
  },
};

export default {
  key: "EditorBlocks",
  entry: graphql(
    `
      fragment EditorBlocks on NodeWithEditorBlocks {
        editorBlocks {
          __typename
          name
          renderedHtml
          id: clientId
          parentId: parentClientId
          ...${editorBlocks.CoreParagraph.key}
          ...${editorBlocks.CoreColumns.key}
          ...${editorBlocks.CoreColumn.key}
          ...${editorBlocks.CoreHeading.key}
          ...${editorBlocks.CoreCode.key}
        }
      }
    `,
    [
      editorBlocks.CoreParagraph.entry,
      editorBlocks.CoreColumns.entry,
      editorBlocks.CoreColumn.entry,
      editorBlocks.CoreHeading.entry,
      editorBlocks.CoreCode.entry,
    ],
  ),
};

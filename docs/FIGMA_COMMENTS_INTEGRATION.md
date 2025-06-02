# Figma Comments Integration

## Overview

The Figma MCP Pro server now supports reading and analyzing designer comments from Figma files. This powerful feature bridges the gap between design and development by automatically extracting implementation instructions from designer comments and converting them into actionable development guidance.

## Use Case

When designers leave comments in Figma describing interactions, animations, or behaviors, the MCP server can:

1. **Read comments** attached to specific components/nodes
2. **Analyze comment content** using AI to detect implementation instructions
3. **Categorize instructions** by type (animation, interaction, behavior, general)
4. **Provide confidence scores** for how likely each comment is an implementation instruction
5. **Include instructions** in the enhanced node data for AI code generation

## How It Works

### Comment Detection

The server uses Figma's REST API to fetch all comments for a file, then:

- Filters comments to only those attached to processed nodes
- Associates comments with their respective design elements
- Analyzes comment text for implementation keywords

### Intelligent Analysis

Comments are analyzed using keyword detection and pattern matching:

#### Animation Instructions
Detects keywords like: `animate`, `transition`, `fade`, `slide`, `bounce`, `scale`, `rotate`, `duration`, `easing`, `spring`, `transform`, `opacity`

**Example**: 
> "This button should animate with a 0.3s ease-in-out transition when hovered"

#### Interaction Instructions  
Detects keywords like: `hover`, `click`, `tap`, `focus`, `active`, `disabled`, `press`, `interaction`, `state`, `trigger`, `event`

**Example**:
> "On click, this modal should open with a fade-in animation"

#### Behavior Instructions
Detects keywords like: `behavior`, `should`, `when`, `if`, `then`, `toggle`, `show`, `hide`, `open`, `close`, `expand`, `collapse`

**Example**:
> "When this accordion item is clicked, it should expand and close others"

### Confidence Scoring

Each detected instruction receives a confidence score (0-1) based on:

- **Keyword matches**: More relevant keywords = higher confidence
- **Imperative language**: Words like "should", "must", "need" boost confidence  
- **Specific measurements**: Values like "300ms", "20px" increase confidence
- **Technical terms**: References to "CSS", "JavaScript", "React" boost confidence

Only instructions with confidence ≥ 0.25 are included in the output.

## Usage

### Enable Comments in get_figma_data

Add the `includeComments` parameter to your tool call:

```json
{
  "fileKey": "your-figma-file-key",
  "nodeId": "specific-node-id", 
  "includeComments": true,
  "framework": "react"
}
```

### Response Structure

When comments are included, nodes are enhanced with:

```json
{
  "id": "123:456",
  "name": "Button Component",
  "type": "COMPONENT",
  "comments": [
    {
      "id": "comment-123",
      "message": "This button should animate on hover with a subtle scale effect",
      "user": {
        "handle": "designer@company.com",
        "img_url": "https://..."
      },
      "created_at": "2024-12-19T10:30:00Z",
      "client_meta": {
        "node_id": "123:456",
        "node_offset": {"x": 100, "y": 50}
      }
    }
  ],
  "commentInstructions": [
    {
      "type": "animation",
      "instruction": "This button should animate on hover with a subtle scale effect",
      "author": "designer@company.com", 
      "timestamp": "2024-12-19T10:30:00Z",
      "confidence": 0.85
    }
  ]
}
```

### Response Metadata

The response includes comment statistics:

```json
{
  "metadata": {
    "includeComments": true,
    "commentStats": {
      "totalComments": 25,
      "relevantComments": 8
    }
  }
}
```

## Integration with AI Code Generation

The comment instructions are designed to work seamlessly with AI coding assistants:

### Example Workflow

1. **Designer adds comment**: "This card should have a subtle hover animation - scale up slightly and add shadow"

2. **MCP detects instruction**:
   ```json
   {
     "type": "animation",
     "instruction": "This card should have a subtle hover animation - scale up slightly and add shadow", 
     "confidence": 0.9
   }
   ```

3. **AI generates code**:
   ```css
   .card:hover {
     transform: scale(1.02);
     box-shadow: 0 8px 25px rgba(0,0,0,0.15);
     transition: all 0.3s ease-in-out;
   }
   ```

## Comment Types and Examples

### Animation Comments
- ✅ "Animate this with a 0.3s transition"
- ✅ "Should fade in when page loads"  
- ✅ "Add bounce effect on button press"
- ✅ "Rotate 45 degrees on hover"

### Interaction Comments  
- ✅ "Open modal on click"
- ✅ "Show tooltip on hover"
- ✅ "Focus state should highlight border"
- ✅ "Disabled state should be grayed out"

### Behavior Comments
- ✅ "Should toggle visibility when clicked" 
- ✅ "Hide this section if user is not logged in"
- ✅ "Expand accordion when selected"
- ✅ "Close dropdown when clicking outside"

### General Comments (Usually Filtered Out)
- ❌ "This looks great!"
- ❌ "Can we make this blue instead?"
- ❌ "Waiting for approval"

## Rate Limits

Comment fetching uses Figma's comments API endpoint with these limits:
- **Cost**: 20 (300 req/min, 60,000 req/day per user)
- **Recommended**: Cache comment data when possible
- **Best Practice**: Only fetch comments when needed for implementation

## Error Handling

The server gracefully handles comment-related errors:

- **API failures**: Continues processing without comments
- **Invalid comments**: Skips malformed comment data  
- **Rate limits**: Respects Figma's API limits
- **Permission issues**: Falls back to processing without comments

## Performance Considerations

- Comments are fetched only when `includeComments: true`
- Only comments attached to processed nodes are analyzed
- Comment analysis is lightweight (keyword matching)
- Results are included in the same response (no additional requests)

## Future Enhancements

Potential improvements being considered:

1. **Machine Learning**: More sophisticated comment analysis using NLP
2. **Comment Threading**: Support for comment conversations  
3. **User Filtering**: Only include comments from specific team members
4. **Custom Keywords**: User-defined keyword sets for comment analysis
5. **Integration Examples**: Pre-built templates for common animation/interaction patterns

## Troubleshooting

### No Comments Appearing

1. **Check parameter**: Ensure `includeComments: true` is set
2. **Verify permissions**: Make sure API key has access to comments
3. **Check file scope**: Comments must be attached to processed nodes
4. **Review confidence**: Comments with low confidence scores are filtered out

### Comments Not Being Analyzed

1. **Keyword matching**: Use clear implementation language in comments
2. **Be specific**: Include technical terms and measurements  
3. **Use imperatives**: Words like "should", "must", "add" help detection
4. **Check confidence**: Lower threshold by reviewing comment content

This feature transforms design comments into actionable development instructions, making the design-to-code process more efficient and accurate. 
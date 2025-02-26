const cheerio = require('cheerio');

function extractFormFields(html) {
  const $ = cheerio.load(html);
  const formFields = [];

  // We'll consider these tags for field extraction
  const tagsToExtract = ['input', 'textarea', 'select', 'button', 'fieldset', 'label'];

  // Query within <form> only
  $('form').find(tagsToExtract.join(', ')).each((_, elem) => {
    const tagName = elem.tagName.toLowerCase();
    const $elem = $(elem);

    // Determine fillability (inputs, selects, textareas).
    // Buttons, fieldsets, and labels are generally not fillable themselves.
    const fillableTags = ['input', 'select', 'textarea'];
    const isFillable = fillableTags.includes(tagName);

    // Build basic field object
    let field = {
      tag: tagName,
      id: $elem.attr('id') || null,
      name: $elem.attr('name') || null,
      type: ($elem.attr('type') || tagName),
      placeholder: $elem.attr('placeholder') || "",
      text: $elem.text().trim() || "",
      description: "",
      context: "",
      fillable: isFillable,
    };

    // 1) Attempt to associate with a <label for="id">
    if (field.id) {
      const lbl = $(`label[for="${field.id}"]`).text().trim();
      if (lbl) field.description = lbl;
    }

    // 2) Fall back to placeholder, name, or text
    if (!field.description) {
      field.description = field.placeholder || field.name || field.text || "";
    }

    // 3) SPECIAL HANDLING FOR FILE INPUTS (Resume/CV)
    //    If empty description and it's a file input, try to see if there's a nearby label
    //    or fieldset text containing "resume"/"cv" or a preceding label sibling.
    if (isFillable && field.type === 'file') {
      // If there's no ID or label, look at the immediate previous element
      // or a parent container for any mention of resume/CV
      if (!field.description) {
        // Check the immediately preceding sibling if it's a label
        const $prev = $elem.prev();
        if ($prev.length && $prev[0].tagName.toLowerCase() === 'label') {
          field.description = $prev.text().trim();
        }
      }

      // If still empty, check the enclosing fieldset or container for keywords
      if (!field.description) {
        const fieldsetText = $elem.closest('fieldset').text().trim();
        if (fieldsetText.match(/resume|cv/i)) {
          field.description = 'Upload your resume/CV';
        }
      }
    }

    // 4) Retrieve up to 20 lines of text from previous siblings for additional context
    const prevElements = $elem.prevAll();
    const contextLines = [];
    prevElements.each((index, el) => {
      if (index >= 20) return false; // stop after 20 elements
      const text = $(el).text().trim();
      if (text) contextLines.unshift(text);
    });
    field.context = contextLines.join(" ");

    formFields.push(field);
  });

  console.log('\x1b[31m', 'Extracted Form Fields:', formFields, '\x1b[0m');
  return formFields;
}

/**
 * Deduplicate fields by:
 *   1. Filtering out non-fillable fields.
 *   2. Grouping by normalized (lowercased) description.
 *   3. Keeping the version with more context or a preferable tag in duplicates.
 */
function deduplicateFormFields(fields) {
  // Only keep fillable fields (e.g., <input>, <select>, <textarea>)
  const fillableFields = fields.filter(field => field.fillable);

  const fieldMap = new Map();
  fillableFields.forEach(field => {
    const key = field.description.trim().toLowerCase();
    if (!key) return; // skip if no description

    if (!fieldMap.has(key)) {
      fieldMap.set(key, field);
    } else {
      // If there's a duplicate, pick the field with more context or a simpler tag
      const existing = fieldMap.get(key);
      const preferThisField =
        field.context.length > existing.context.length ||
        (field.tag === 'input' && existing.tag !== 'input');
      if (preferThisField) {
        fieldMap.set(key, field);
      }
    }
  });

  const deduped = [...fieldMap.values()];
  console.log('\x1b[32m', 'Deduplicated Form Fields:', deduped, '\x1b[0m');
  return deduped;
}

module.exports = {
  extractFormFields,
  deduplicateFormFields,
};

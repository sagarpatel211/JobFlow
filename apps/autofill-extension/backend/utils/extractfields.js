import { load } from 'cheerio';

export const extractFields = (htmlData) => {
  const $ = load(htmlData);
  let fields = [];

  $('input, select, textarea').each((i, elem) => {
    const inputType = $(elem).attr('type') || 'text';
    const name = $(elem).attr('name') || '';
    const id = $(elem).attr('id') || '';
    let label = '';

    if (id) {
      label = $(`label[for="${id}"]`).text().trim();
    }
    if (!label) {
      label = $(elem).attr('placeholder') || '';
    }

    fields.push({ tag: elem.tagName, type: inputType, name, id, label });
  });

  return fields;
};

/**
 * UNIVERSAL XML ENGINE - PERFECT KEYBOARD
 * Parser & Generator untuk format file XML Perfect Keyboard (Pitrinec) & Macro Toolworks.
 * Mendukung pembacaan group, macro, shortcut trigger, hotkey, dan pembersihan macro/HTML syntax secara sempurna.
 */

(function () {
  'use strict';

  // Helper untuk memformat kode virtual key (hk) menjadi nama HotKey yang mudah dibaca
  function formatHotkey(hkVal) {
    if (!hkVal) return '';
    const code = parseInt(hkVal, 10);
    if (isNaN(code) || code <= 0) return '';

    // Ambil virtual key code (byte rendah)
    const vk = code & 0xFF;

    // Mapping Numpad standar Windows
    const numpadMap = {
      0x60: 'Num 0',
      0x61: 'Num 1',
      0x62: 'Num 2',
      0x63: 'Num 3',
      0x64: 'Num 4',
      0x65: 'Num 5',
      0x66: 'Num 6',
      0x67: 'Num 7',
      0x68: 'Num 8',
      0x69: 'Num 9',
      0x6A: 'Num *',
      0x6B: 'Num +',
      0x6C: 'Num Enter',
      0x6D: 'Num -',
      0x6E: 'Num .',
      0x6F: 'Num /'
    };

    if (numpadMap[vk]) {
      return `HotKey: ${numpadMap[vk]}`;
    }

    // Function keys F1 - F24
    if (vk >= 0x70 && vk <= 0x87) {
      return `HotKey: F${vk - 0x70 + 1}`;
    }

    // Numbers 0 - 9
    if (vk >= 0x30 && vk <= 0x39) {
      return `HotKey: ${String.fromCharCode(vk)}`;
    }

    // Letters A - Z
    if (vk >= 0x41 && vk <= 0x5A) {
      return `HotKey: ${String.fromCharCode(vk)}`;
    }

    return `HotKey: Key_${vk.toString(16).toUpperCase()}`;
  }

  // Helper untuk membersihkan sintaks macro Perfect Keyboard & MSHTML menjadi teks rapi
  function cleanMacroContent(rawText, trigger) {
    if (!rawText) return '';
    let text = String(rawText);

    // 1. Hilangkan pembungkus CDATA jika ada
    text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');

    // 2. Hilangkan prefix Macro Toolworks / Perfect Keyboard
    text = text.replace(/^text#macro:\s*/i, '');
    text = text.replace(/^macro#text:\s*/i, '');
    text = text.replace(/^text:\s*/i, '');

    // 3. Tangani format HTML yang diexport dari MSHTML / Rich Text Perfect Keyboard
    if (/<(HTML|BODY|P|BR|SPAN|DIV|META|HEAD|STYLE)[\s\S]*?>/i.test(text)) {
      // Hilangkan seluruh blok head, style, script, title
      text = text.replace(/<head[\s\S]*?<\/head>/gi, '');
      text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
      text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
      text = text.replace(/<title[\s\S]*?<\/title>/gi, '');

      // Konversi tag pemutus baris HTML menjadi karakter newline (\n)
      text = text.replace(/<br\s*[\/]?>/gi, '\n');
      text = text.replace(/<\/p>/gi, '\n');
      text = text.replace(/<\/div>/gi, '\n');
      text = text.replace(/<\/tr>/gi, '\n');
      text = text.replace(/<p\b[^>]*>/gi, '');
      text = text.replace(/<div\b[^>]*>/gi, '');

      // Ekstrak tautan <A href="...">teks</A> -> utamakan isi teks link atau URL href
      text = text.replace(/<a\b[^>]*href=["']?([^"'>\s]+)["']?[^>]*>([\s\S]*?)<\/a>/gi, function(match, href, linkText) {
        const cleanLink = linkText.replace(/<[^>]+>/g, '').trim();
        return cleanLink || href;
      });

      // Hilangkan semua tag HTML yang tersisa (<BODY>, </BODY>, <SPAN ...>, </SPAN>, dll)
      text = text.replace(/<[^>]+>/g, '');
    }

    // 4. Standarisasi line break & macro command Perfect Keyboard
    text = text.replace(/<ent__>/gi, '\n');
    text = text.replace(/<#enter>/gi, '\n');
    text = text.replace(/<enter>/gi, '\n');
    text = text.replace(/<#tab>/gi, '\t');
    text = text.replace(/<tab>/gi, '\t');

    // 5. Hilangkan macro command delay/mouse/window/calc dll
    text = text.replace(/<#(wait|pause|delay)\s*[^>]*>/gi, '');
    text = text.replace(/<#(beep|sound)\s*[^>]*>/gi, '');
    text = text.replace(/<#(mouse|window|exec|file|var|calc)\s*[^>]*>/gi, '');

    // 6. Decode HTML entities umum
    text = text.replace(/&nbsp;/gi, ' ');
    text = text.replace(/&amp;/gi, '&');
    text = text.replace(/&lt;/gi, '<');
    text = text.replace(/&gt;/gi, '>');
    text = text.replace(/&quot;/gi, '"');
    text = text.replace(/&#39;/gi, "'");
    text = text.replace(/&apos;/gi, "'");
    text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
    text = text.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

    // 7. Bersihkan spasi ganda dan baris kosong berlebihan
    const lines = text.split(/\r?\n/).map(line => line.trim());
    text = lines.join('\n');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();

    // 8. Jika di akhir teks ada trigger yang tidak sengaja terbawa, bersihkan
    if (trigger && trigger !== '-' && trigger.length > 1) {
      const escapedTrig = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const trailingRegex = new RegExp(`\\s+${escapedTrig}\\s*$`, 'i');
      text = text.replace(trailingRegex, '');
    }

    return text.trim();
  }

  // Helper membaca teks dari elemen XML DOM
  function extractNodeContent(node) {
    if (!node) return '';

    // 1. Tag macroText (format resmi Macro Toolworks / Perfect Keyboard)
    const macroTextNode = node.querySelector(':scope > macroText, :scope > macrotext, macroText, macrotext');
    if (macroTextNode) {
      return macroTextNode.textContent || '';
    }

    // 2. Tag text/content/data/script yang langsung berada di bawah elemen ini
    const textNode = node.querySelector(':scope > text, :scope > content, :scope > data, :scope > script');
    if (textNode) {
      return textNode.textContent || '';
    }

    // 3. Tag commands / command
    const commandNodes = node.querySelectorAll(':scope > commands > command, :scope > command');
    if (commandNodes && commandNodes.length > 0) {
      const parts = [];
      commandNodes.forEach(cmd => {
        const cmdText = cmd.textContent || '';
        if (cmdText.trim()) parts.push(cmdText);
      });
      if (parts.length > 0) return parts.join('\n');
    }

    // 4. Hanya ambil direct text nodes dari macroNode (jangan gunakan node.textContent yang merembet ke <trigger>/<tscut>)
    let directText = '';
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === 3 /* TEXT_NODE */ || child.nodeType === 4 /* CDATA_SECTION_NODE */) {
        directText += child.nodeValue;
      }
    }

    return directText.trim();
  }

  // Regex fallback parser untuk XML yang memiliki struktur tidak standar atau parsererror
  function parseWithRegex(xmlString, defaultCategory = 'Custom') {
    const templates = [];
    const categoriesSet = new Set();
    const macroRegex = /<macro\b([\s\S]*?)<\/macro>/gi;
    let match;

    while ((match = macroRegex.exec(xmlString)) !== null) {
      const macroBlock = match[0];
      const attrsStr = match[1];

      // Ambil nama
      let name = '';
      const nameAttrMatch = attrsStr.match(/\bname=["']([^"']*)["']/i);
      if (nameAttrMatch && nameAttrMatch[1].trim()) {
        name = nameAttrMatch[1].trim();
      }
      if (!name) {
        const nameTagMatch = macroBlock.match(/<name>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/name>/i);
        if (nameTagMatch) name = nameTagMatch[1].trim();
      }

      // Ambil trigger
      let trigger = '';
      let triggerType = 'shortcut';

      // 1. Cek tscut / shortcut di dalam trigger
      const tscutMatch = macroBlock.match(/<tscut>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/tscut>/i) ||
                         macroBlock.match(/<shortcut>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/shortcut>/i);
      if (tscutMatch && tscutMatch[1] && tscutMatch[1].trim()) {
        trigger = tscutMatch[1].replace(/^\s+/, '');
        triggerType = 'shortcut';
      }

      // 2. Cek hk attribute
      if (!trigger) {
        const hkMatch = macroBlock.match(/\bhk=["']([^"']+)["']/i);
        if (hkMatch && hkMatch[1] !== '0') {
          const formatted = formatHotkey(hkMatch[1]);
          if (formatted) {
            trigger = formatted;
            triggerType = 'hotkey';
          }
        }
      }

      // 3. Cek attribute shortcut/trigger/hotkey langsung pada tag macro
      if (!trigger) {
        const shortcutAttr = attrsStr.match(/\b(?:shortcut|trigger|hotkey)=["']([^"']+)["']/i);
        if (shortcutAttr && shortcutAttr[1].trim()) {
          trigger = shortcutAttr[1].trim();
          triggerType = trigger.toLowerCase().startsWith('hotkey') ? 'hotkey' : 'shortcut';
        }
      }

      // Standarisasi hotkey
      if (trigger && (trigger.toLowerCase().startsWith('hotkey') || triggerType === 'hotkey')) {
        triggerType = 'hotkey';
        if (!trigger.toLowerCase().startsWith('hotkey:')) {
          trigger = 'HotKey: ' + trigger.replace(/^hotkey\s*:?\s*/i, '');
        }
      }

      if (!trigger) {
        trigger = name || '-';
        if (trigger === '-') triggerType = 'none';
      }

      // Ambil Konten Teks
      let rawContent = '';
      const macroTextMatch = macroBlock.match(/<macroText>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/macroText>/i);
      if (macroTextMatch) {
        rawContent = macroTextMatch[1];
      } else {
        const textTagMatch = macroBlock.match(/<(?:text|content|data)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:text|content|data)>/i);
        if (textTagMatch) {
          rawContent = textTagMatch[1];
        }
      }

      const cleanContent = cleanMacroContent(rawContent, trigger);

      if (cleanContent) {
        const category = defaultCategory || 'Custom';
        categoriesSet.add(category);
        const id = 'pk_xml_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);

        templates.push({
          id: id,
          category: category,
          categoryCode: category.toLowerCase().replace(/\s+/g, '_'),
          trigger: trigger,
          triggerType: triggerType,
          name: name || trigger,
          content: cleanContent,
          charCount: cleanContent.length,
          isPinned: false,
          copyCount: 0,
          createdAt: new Date().toISOString()
        });
      }
    }

    return {
      success: templates.length > 0,
      templates: templates,
      categories: Array.from(categoriesSet),
      totalCount: templates.length
    };
  }

  const XmlEngine = {
    cleanMacroContent: cleanMacroContent,
    formatHotkey: formatHotkey,

    /**
     * Parse string XML menjadi array template PK VAULT
     * @param {string} xmlString 
     * @param {object} options { defaultCategory?: string, filename?: string }
     * @returns {{ success: boolean, templates: Array, categories: Array, totalCount: number, error?: string }}
     */
    parse: function (xmlString, options) {
      if (!xmlString || typeof xmlString !== 'string' || !xmlString.trim()) {
        return { success: false, templates: [], categories: [], totalCount: 0, error: 'Teks XML kosong!' };
      }

      const defaultCat = (options && options.defaultCategory) ? options.defaultCategory : 'Custom';

      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        // Jika terjadi parsererror, jalankan regex fallback
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
          const fallbackRes = parseWithRegex(xmlString, defaultCat);
          if (fallbackRes.success) return fallbackRes;
          return {
            success: false,
            templates: [],
            categories: [],
            totalCount: 0,
            error: 'Format XML tidak valid: ' + parseError.textContent.slice(0, 150)
          };
        }

        const templates = [];
        const categoriesSet = new Set();

        function extractMacro(macroNode, category) {
          // 1. Ambil Nama
          let name = macroNode.getAttribute('name') || 
                     macroNode.getAttribute('title') || 
                     macroNode.getAttribute('desc') || '';
          
          const nameChild = macroNode.querySelector(':scope > name, :scope > title');
          if (nameChild && !name) name = nameChild.textContent.trim();

          // 2. Ambil Trigger & Tentukan TriggerType
          let trigger = '';
          let triggerType = 'shortcut';

          // Cek tag trigger
          const trigNode = macroNode.querySelector(':scope > trigger, trigger');
          if (trigNode) {
            // Cek text shortcut (<tscut>, <shortcut>, dll)
            const tscutNode = trigNode.querySelector('tscut, shortcut, text_shortcut, abbrev, abbreviation');
            if (tscutNode && tscutNode.textContent && tscutNode.textContent.trim()) {
              trigger = tscutNode.textContent.replace(/^\s+/, '');
              triggerType = 'shortcut';
            }

            // Cek hotkey via attribute hk
            const hkAttr = trigNode.getAttribute('hk');
            if ((!trigger || trigger === '-') && hkAttr && hkAttr !== '0') {
              const formattedHk = formatHotkey(hkAttr);
              if (formattedHk) {
                trigger = formattedHk;
                triggerType = 'hotkey';
              }
            }

            if (!trigger && trigNode.getAttribute('hotkey')) {
              trigger = trigNode.getAttribute('hotkey');
              triggerType = 'hotkey';
            }

            if (!trigger && trigNode.textContent.trim()) {
              trigger = trigNode.textContent.trim();
            }
          }

          // Cek attributes langsung pada tag macro
          if (!trigger) {
            const hkAttr = macroNode.getAttribute('hk');
            if (hkAttr && hkAttr !== '0') {
              trigger = formatHotkey(hkAttr);
              triggerType = 'hotkey';
            } else if (macroNode.getAttribute('hotkey')) {
              trigger = macroNode.getAttribute('hotkey');
              triggerType = 'hotkey';
            } else if (macroNode.getAttribute('shortcut')) {
              trigger = macroNode.getAttribute('shortcut');
              triggerType = 'shortcut';
            } else if (macroNode.getAttribute('trigger')) {
              trigger = macroNode.getAttribute('trigger');
              triggerType = trigger.toLowerCase().startsWith('hotkey') ? 'hotkey' : 'shortcut';
            }
          }

          // Cek tag shortcut/hotkey langsung di bawah macro
          if (!trigger) {
            const shortcutNode = macroNode.querySelector(':scope > shortcut, :scope > tscut, shortcut, tscut');
            if (shortcutNode && shortcutNode.textContent.trim()) {
              trigger = shortcutNode.textContent.trim();
              triggerType = 'shortcut';
            }
          }

          if (!trigger) {
            const hotkeyNode = macroNode.querySelector(':scope > hotkey, hotkey');
            if (hotkeyNode && hotkeyNode.textContent.trim()) {
              trigger = hotkeyNode.textContent.trim();
              triggerType = 'hotkey';
            }
          }

          // Standarisasi label HotKey
          if (trigger && (trigger.toLowerCase().startsWith('hotkey') || triggerType === 'hotkey')) {
            triggerType = 'hotkey';
            if (!trigger.toLowerCase().startsWith('hotkey:')) {
              trigger = 'HotKey: ' + trigger.replace(/^hotkey\s*:?\s*/i, '');
            }
          }

          if (!trigger) {
            trigger = name || '-';
            if (trigger === '-') triggerType = 'none';
          }

          // 3. Ambil Konten Teks & Bersihkan
          let rawContent = extractNodeContent(macroNode);
          if (!rawContent) {
            // Coba regex pada outerHTML jika direct extraction kosong
            const mTextMatch = (macroNode.outerHTML || '').match(/<macroText>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/macroText>/i);
            if (mTextMatch) rawContent = mTextMatch[1];
          }

          const cleanContent = cleanMacroContent(rawContent, trigger);

          if (cleanContent) {
            const finalCat = category || defaultCat;
            categoriesSet.add(finalCat);

            const id = 'pk_xml_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
            templates.push({
              id: id,
              category: finalCat,
              categoryCode: finalCat.toLowerCase().replace(/\s+/g, '_'),
              trigger: trigger,
              triggerType: triggerType,
              name: name || trigger,
              content: cleanContent,
              charCount: cleanContent.length,
              isPinned: false,
              copyCount: 0,
              createdAt: new Date().toISOString()
            });
          }
        }

        function processGroup(groupNode, currentCategory) {
          const groupName = groupNode.getAttribute('name') || 
                            groupNode.getAttribute('title') || 
                            groupNode.getAttribute('label') || 
                            currentCategory || 
                            defaultCat;

          categoriesSet.add(groupName);

          const children = groupNode.children;
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const tag = child.tagName.toLowerCase();

            if (tag === 'group' || tag === 'folder' || tag === 'category') {
              processGroup(child, groupName);
            } else if (tag === 'macro' || tag === 'item' || tag === 'template') {
              extractMacro(child, groupName);
            }
          }
        }

        // Cari grup root utama
        const rootGroups = xmlDoc.querySelectorAll('macro_file > group, root > group, macros > group, library > group, group');

        if (rootGroups.length > 0) {
          rootGroups.forEach(grp => {
            if (!grp.parentElement || grp.parentElement.tagName.toLowerCase() !== 'group') {
              processGroup(grp, grp.getAttribute('name') || defaultCat);
            }
          });
        } else {
          // Jika tidak ada tag <group>, proses seluruh elemen <macro>, <item>, atau <template>
          const allMacros = xmlDoc.querySelectorAll('macro, item, template');
          allMacros.forEach(m => {
            extractMacro(m, defaultCat);
          });
        }

        // Jika DOMParser menghasilkan 0 template, coba regex fallback
        if (templates.length === 0) {
          const fallbackRes = parseWithRegex(xmlString, defaultCat);
          if (fallbackRes.success) return fallbackRes;

          return {
            success: false,
            templates: [],
            categories: [],
            totalCount: 0,
            error: 'Tidak ditemukan data macro/template yang valid di dalam file XML tersebut.'
          };
        }

        return {
          success: true,
          templates: templates,
          categories: Array.from(categoriesSet),
          totalCount: templates.length
        };

      } catch (err) {
        // Fallback jika terjadi error tak terduga pada DOMParser
        const fallbackRes = parseWithRegex(xmlString, defaultCat);
        if (fallbackRes.success) return fallbackRes;

        return {
          success: false,
          templates: [],
          categories: [],
          totalCount: 0,
          error: 'Gagal memproses XML: ' + (err.message || err)
        };
      }
    },

    /**
     * Generate XML standar Perfect Keyboard dari daftar templates PK VAULT
     * @param {Array} templates 
     * @returns {string} XML string
     */
    generate: function (templates) {
      if (!Array.isArray(templates)) templates = [];

      const groups = {};
      templates.forEach(t => {
        const cat = t.category || 'Custom';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(t);
      });

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<!-- Exported from PK VAULT (Perfect Keyboard Native Format) -->\n';
      xml += '<mtw_export_macros generator="PK VAULT" version="1.0">\n';

      for (const [groupName, items] of Object.entries(groups)) {
        const safeGroupName = escapeXmlAttr(groupName);
        xml += `  <group name="${safeGroupName}">\n`;

        items.forEach(item => {
          const safeName = escapeXmlAttr(item.name || item.trigger || 'Macro');
          const safeTrigger = escapeXmlAttr(item.trigger || '');
          const isHotkey = item.triggerType === 'hotkey';

          xml += `    <macro name="${safeName}">\n`;
          if (isHotkey) {
            xml += `      <trigger hotkey="${safeTrigger}"/>\n`;
          } else if (item.trigger && item.trigger !== '-') {
            xml += `      <trigger><tscut><![CDATA[${item.trigger}]]></tscut></trigger>\n`;
          } else {
            xml += `      <trigger/>\n`;
          }

          const rawContent = item.content || '';
          xml += `      <macroText><![CDATA[${rawContent}]]></macroText>\n`;
          xml += `    </macro>\n`;
        });

        xml += `  </group>\n`;
      }

      xml += '</mtw_export_macros>\n';
      return xml;
    },

    /**
     * Unduh string XML sebagai file .xml di browser pengguna
     * @param {string} xmlString 
     * @param {string} filename 
     */
    download: function (xmlString, filename) {
      const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const now = new Date().toISOString().slice(0, 10);
      const name = filename || `PK_PerfectKeyboard_Export_${now}.xml`;

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    }
  };

  function escapeXmlAttr(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  window.XmlEngine = XmlEngine;
})();

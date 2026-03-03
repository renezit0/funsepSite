import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface GeneratePDFOptions {
  htmlContent: string;
  filename: string;
}

export async function generatePDFFromHTML({ htmlContent, filename }: GeneratePDFOptions): Promise<void> {
  // Referência ao iframe para garantir limpeza
  let iframeRef: HTMLIFrameElement | null = null;
  const extractedToken = (() => {
    const tokenLabelIndex = htmlContent.indexOf('Token de Validação');
    if (tokenLabelIndex === -1) return null;

    const tokenSlice = htmlContent.slice(tokenLabelIndex, tokenLabelIndex + 600);
    const uuidMatch = tokenSlice.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    if (uuidMatch) return uuidMatch[0];

    return null;
  })();

  try {
    // Criar iframe isolado para não afetar estilos da página principal
    const iframe = document.createElement('iframe');
    iframeRef = iframe;
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '750px';
    iframe.style.height = '3000px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    // Aguardar iframe carregar
    await new Promise(resolve => setTimeout(resolve, 100));

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Não foi possível acessar o documento do iframe');
    }

    // Escrever o HTML completo no iframe (já vem com estilos da edge function)
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Aguardar renderização completa dos elementos
    await new Promise(resolve => setTimeout(resolve, 800));

    const tempDiv = iframeDoc.body as HTMLElement;
    if (!tempDiv) {
      throw new Error('Body do iframe não encontrado');
    }
    
    // Forçar reflow para garantir que offsetHeight funcione
    void tempDiv.offsetHeight;

    console.log('Iniciando paginação inteligente...');

    // Configuração de página A4 para o PDF
    const pageWidth = 210; // mm
    const marginLeft = 12;
    const marginTop = 8;
    const marginRight = 12;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Altura máxima por página em pixels
    const maxHeightPx = 1040;

    // Obter elementos principais
    const header = tempDiv.querySelector('.header') as HTMLElement;
    const infoBox = tempDiv.querySelector('.info-box') as HTMLElement;
    const footer = tempDiv.querySelector('.footer') as HTMLElement;

    // Token é o último div que contém "Token de Validação"
    const allDivs = Array.from(tempDiv.querySelectorAll('div'));
    const tokenDiv = allDivs.find(div => div.textContent?.includes('Token de Validação')) as HTMLElement;

    // Incluir .highlight (observações), .separador-dependente (espaçamento entre tabelas) mas NÃO incluir .total-geral (é TR dentro de table)
    const sections = Array.from(tempDiv.querySelectorAll('.declaracao-text, .section-title, table, .no-data, .highlight, .separador-dependente, div[style*="height"]')) as HTMLElement[];

    console.log('=== DEBUG ESPAÇAMENTO ===');
    console.log('Total de sections encontradas:', sections.length);
    sections.forEach((section, idx) => {
      console.log(`Section ${idx}:`, section.tagName, section.className, 'height:', section.offsetHeight);
    });

    // Função para agrupar elementos em páginas
    const paginas: HTMLElement[][] = [];
    let paginaAtual: HTMLElement[] = [];
    let alturaAcumulada = 0;

    // Fator de correção: html2canvas renderiza maior que as medições do DOM
    const FATOR_CORRECAO = 1.10;
    
    // Função auxiliar para obter altura real do elemento
    const getElementHeight = (el: HTMLElement): number => {
      const rect = el.getBoundingClientRect();
      let height = rect.height;
      
      if (!height || height === 0) {
        height = el.offsetHeight;
      }
      
      height = height * FATOR_CORRECAO;
      
      if (!height || height === 0) {
        const textContent = el.textContent || '';
        
        if (el.tagName === 'TR') {
          const textLength = textContent.length;
          const estimatedLines = Math.max(1, Math.ceil(textLength / 80));
          height = Math.max(32, estimatedLines * 22 + 10);
        } else if (el.tagName === 'TABLE') {
          const rows = el.querySelectorAll('tr').length;
          height = rows * 40 + 50;
        } else if (el.classList.contains('section-title')) {
          height = 35;
        } else if (el.classList.contains('info-box')) {
          height = 100;
        } else if (el.classList.contains('header')) {
          height = 120;
        } else if (el.classList.contains('footer')) {
          height = 80;
        } else {
          height = 40;
        }
      }
      
      return height;
    };

    // Calcular altura inicial (header + infoBox)
    let headerInfoHeight = 0;
    if (header) headerInfoHeight += getElementHeight(header);
    if (infoBox) headerInfoHeight += getElementHeight(infoBox);

    alturaAcumulada = headerInfoHeight;

    // Processar cada seção
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionHeight = getElementHeight(section);

      if (section.classList.contains('section-title')) {
        // Verificar se o próximo elemento é uma tabela de resumo
        const proximaSection = i + 1 < sections.length ? sections[i + 1] : null;
        const isTituloResumo = section.textContent?.includes('Resumo') && 
                               proximaSection?.tagName === 'TABLE' && 
                               proximaSection?.classList.contains('resumo-compacto');
        
        if (isTituloResumo) {
          let alturaFutura = sectionHeight + getElementHeight(proximaSection);
          for (let j = i + 2; j < sections.length; j++) {
            alturaFutura += getElementHeight(sections[j]);
          }
          if (footer) alturaFutura += getElementHeight(footer);
          if (tokenDiv) alturaFutura += getElementHeight(tokenDiv);
          
          if (alturaAcumulada + alturaFutura > maxHeightPx && paginaAtual.length > 0) {
            paginas.push([...paginaAtual]);
            paginaAtual = [];
            alturaAcumulada = 0;
          }
        } else {
          if (alturaAcumulada + sectionHeight > maxHeightPx) {
            if (paginaAtual.length > 0) {
              paginas.push([...paginaAtual]);
              paginaAtual = [];
              alturaAcumulada = 0;
            }
          }
        }

        paginaAtual.push(section);
        alturaAcumulada += sectionHeight;
      } else if (section.tagName === 'TABLE') {
        // Se é tabela de dependente, adicionar espaço ANTES
        const isTabelaDependente = section.classList.contains('tabela-dependente');
        if (isTabelaDependente) {
          console.log('🔴 TABELA DE DEPENDENTE DETECTADA - Adicionando 120px de espaço');
          alturaAcumulada += 120; // Adicionar espaço virtual entre tabelas
        }

        const tbody = section.querySelector('tbody');
        const allRows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];

        const normalRows: HTMLElement[] = [];
        const totalRows: HTMLElement[] = [];

        for (const row of allRows) {
          if (row.classList.contains('total-row') || row.classList.contains('total-geral')) {
            totalRows.push(row as HTMLElement);
          } else {
            normalRows.push(row as HTMLElement);
          }
        }

        const totalRowsHeight = totalRows.reduce((acc, row) => acc + getElementHeight(row), 0);

        const theadClone = section.querySelector('thead')?.cloneNode(true);
        const tbodyClone = iframeDoc.createElement('tbody');

        let tempTable = iframeDoc.createElement('table');
        tempTable.className = section.className;
        if (theadClone) tempTable.appendChild(theadClone);
        tempTable.appendChild(tbodyClone);

        for (let rowIndex = 0; rowIndex < normalRows.length; rowIndex++) {
          const row = normalRows[rowIndex];
          const rowHeight = getElementHeight(row);
          const isLastRow = rowIndex === normalRows.length - 1;
          const espacoNecessario = isLastRow ? rowHeight + totalRowsHeight : rowHeight;

          if (alturaAcumulada + espacoNecessario > maxHeightPx) {
            const temConteudo = paginaAtual.length > 0 || tbodyClone.children.length > 0;

            if (temConteudo) {
              paginaAtual.push(tempTable);
              paginas.push([...paginaAtual]);
              paginaAtual = [];
              alturaAcumulada = 0;
              tempTable = iframeDoc.createElement('table');
              tempTable.className = section.className;
              if (theadClone) tempTable.appendChild(theadClone.cloneNode(true) as Node);
              const newTbody = iframeDoc.createElement('tbody');
              tempTable.appendChild(newTbody);
              newTbody.appendChild(row.cloneNode(true));
              alturaAcumulada += rowHeight;
            } else {
              const currentBody = tempTable.querySelector('tbody') || tbodyClone;
              currentBody.appendChild(row.cloneNode(true));
              alturaAcumulada += rowHeight;
            }
          } else {
            const currentBody = tempTable.querySelector('tbody') || tbodyClone;
            currentBody.appendChild(row.cloneNode(true));
            alturaAcumulada += rowHeight;
          }
        }

        const currentTbody = tempTable.querySelector('tbody');
        if (currentTbody) {
          for (const totalRow of totalRows) {
            const totalHeight = getElementHeight(totalRow);

            if (alturaAcumulada + totalHeight > maxHeightPx) {
              const temConteudo = paginaAtual.length > 0 || currentTbody.children.length > 0;

              if (temConteudo) {
                paginaAtual.push(tempTable);
                paginas.push([...paginaAtual]);
                paginaAtual = [];
                alturaAcumulada = 0;
                tempTable = iframeDoc.createElement('table');
                tempTable.className = section.className;
                const emptyTbody = iframeDoc.createElement('tbody');
                tempTable.appendChild(emptyTbody);
              }
            }

            const tbody = tempTable.querySelector('tbody');
            if (tbody) {
              tbody.appendChild(totalRow.cloneNode(true));
              alturaAcumulada += totalHeight;
            }
          }
        }

        if (tempTable.querySelector('tbody')?.children.length) {
          paginaAtual.push(tempTable);
        }
      } else {
        if (alturaAcumulada + sectionHeight > maxHeightPx) {
          if (paginaAtual.length > 0) {
            paginas.push([...paginaAtual]);
            paginaAtual = [];
            alturaAcumulada = 0;
          }
        }
        paginaAtual.push(section);
        alturaAcumulada += sectionHeight;
      }
    }

    // Adicionar footer e token
    if (footer) {
      const footerHeight = getElementHeight(footer);
      if (alturaAcumulada + footerHeight > maxHeightPx && paginaAtual.length > 0) {
        paginas.push([...paginaAtual]);
        paginaAtual = [];
        alturaAcumulada = 0;
      }
      paginaAtual.push(footer);
      alturaAcumulada += footerHeight;
    }

    if (tokenDiv && tokenDiv.textContent?.includes('Token')) {
      const tokenHeight = getElementHeight(tokenDiv);
      if (alturaAcumulada + tokenHeight > maxHeightPx && paginaAtual.length > 0) {
        paginas.push([...paginaAtual]);
        paginaAtual = [];
        alturaAcumulada = 0;
      }
      paginaAtual.push(tokenDiv);
    }

    if (paginaAtual.length > 0) {
      paginas.push(paginaAtual);
    }

    // Criar PDF
    const pdf = new jsPDF('p', 'mm', 'a4');

    for (let i = 0; i < paginas.length; i++) {
      while (iframeDoc.body.firstChild) {
        iframeDoc.body.removeChild(iframeDoc.body.firstChild);
      }

      const pageDiv = iframeDoc.createElement('div');
      pageDiv.style.width = '702px';
      pageDiv.style.backgroundColor = '#ffffff';
      pageDiv.style.boxSizing = 'border-box';
      pageDiv.style.padding = i === 0 ? '2px 8px 20px 8px' : '0px 8px 20px 8px';
      pageDiv.style.fontFamily = 'Arial, sans-serif';
      pageDiv.style.fontSize = '10px';
      pageDiv.style.lineHeight = '1.4';
      pageDiv.style.color = '#333';
      pageDiv.style.margin = '0';

      if (i === 0) {
        if (header) pageDiv.appendChild(header.cloneNode(true));
        if (infoBox) pageDiv.appendChild(infoBox.cloneNode(true));
      }

      paginas[i].forEach((el, idx) => {
        const clone = el.cloneNode(true) as HTMLElement;
        const isDependente = clone.classList && clone.classList.contains('tabela-dependente');

        console.log(`Adicionando elemento ${idx}: tag=${clone.tagName}, isDependente=${isDependente}, classes="${clone.className}"`);

        pageDiv.appendChild(clone);
      });

      iframeDoc.body.appendChild(pageDiv);

      await new Promise(resolve => setTimeout(resolve, 150));

      const iframeWindow = iframe.contentWindow;
      const canvas = await html2canvas(pageDiv, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 702,
        windowWidth: 750,
        onclone: (clonedDoc) => {
          const existingStyles = clonedDoc.head.querySelectorAll('style, link[rel="stylesheet"]');
          existingStyles.forEach(el => el.remove());
          
          const styles = iframeDoc.head.querySelectorAll('style');
          styles.forEach(style => {
            clonedDoc.head.appendChild(style.cloneNode(true));
          });
          
          clonedDoc.body.style.cssText = 'margin:0!important;padding:0!important;font-size:10px!important;line-height:1.4!important;font-family:Arial,sans-serif!important;color:#333!important;background:#fff!important;';
          
          const allTables = clonedDoc.body.querySelectorAll('table');
          console.log('=== Processando tabelas no PDF - Total:', allTables.length);
          allTables.forEach((table, idx) => {
            const htmlTable = table as HTMLElement;
            const isDependente = htmlTable.classList.contains('tabela-dependente');
            console.log(`Tabela ${idx}: isDependente=${isDependente}, classes="${htmlTable.className}"`);

            // NÃO forçar margin:0 em tabelas de dependentes (precisam do espaçamento)
            if (isDependente) {
              htmlTable.style.cssText = 'padding:0!important;border-collapse:collapse!important;width:100%!important;margin-top:80px!important;margin-bottom:20px!important;';
              console.log('  -> Aplicando margin-top: 80px');
            } else {
              htmlTable.style.cssText = 'margin:0!important;padding:0!important;border-collapse:collapse!important;width:100%!important;';
            }
            
            const allCells = table.querySelectorAll('th, td');
            allCells.forEach(cell => {
              const htmlCell = cell as HTMLElement;
              htmlCell.style.margin = '0!important';
              htmlCell.style.verticalAlign = 'middle!important';
              htmlCell.style.borderCollapse = 'collapse!important';
            });
          });
        }
      });

      if (i > 0) pdf.addPage();

      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', marginLeft, marginTop, imgWidth, imgHeight, undefined, 'FAST');
      
      // Numeração da página
      const pageNum = i + 1;
      const totalPages = paginas.length;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${pageNum}/${totalPages}`, 210 - marginLeft, 297 - marginLeft, { align: 'right' });

      // Escrever token como texto real no PDF (selecionável/copiável), na última página
      if (extractedToken && i === totalPages - 1) {
        const validationUrl = `https://funsep.com.br/valida-token?=${extractedToken}`;
        const tokenBoxY = 285;
        const tokenBoxHeight = 8;
        pdf.setFillColor(255, 255, 255);
        pdf.rect(marginLeft, tokenBoxY, 185, tokenBoxHeight, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(30, 30, 30);
        pdf.text(`Validar: ${validationUrl}`, marginLeft + 1, tokenBoxY + 5.2, { maxWidth: 182 });
      }
    }

    pdf.save(filename);
  } finally {
    if (iframeRef && iframeRef.parentNode) {
      iframeRef.parentNode.removeChild(iframeRef);
    }
  }
}

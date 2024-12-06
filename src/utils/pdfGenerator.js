import jsPDF from 'jspdf';

export const generatePDF = async (documento) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;

  // Função auxiliar para adicionar texto com quebra de linha
  const addWrappedText = (text, y, fontSize = 12, isTitle = false) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    doc.text(lines, margin, y);
    return y + (lines.length * fontSize * 0.352778) + (isTitle ? 10 : 5);
  };

  // Título do documento
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText(documento.titulo, yPosition, 16, true);

  // Metadados
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPosition = addWrappedText(`Tipo: ${documento.tipo}`, yPosition);
  yPosition = addWrappedText(`Autor: ${documento.autor}`, yPosition);
  yPosition = addWrappedText(`Data de Criação: ${new Date(documento.dataCriacao).toLocaleDateString()}`, yPosition);
  if (documento.dataAtualizacao) {
    yPosition = addWrappedText(`Última Atualização: ${new Date(documento.dataAtualizacao).toLocaleDateString()}`, yPosition);
  }

  yPosition += 10;

  // Conteúdo do documento
  const conteudo = JSON.parse(documento.conteudo);
  
  Object.entries(conteudo).forEach(([key, value]) => {
    if (key !== 'titulo') {
      // Título da seção
      doc.setFont('helvetica', 'bold');
      yPosition = addWrappedText(key.replace(/_/g, ' ').toUpperCase(), yPosition, 14);

      // Conteúdo da seção
      doc.setFont('helvetica', 'normal');
      yPosition = addWrappedText(value, yPosition);

      // Espaço entre seções
      yPosition += 10;

      // Verificar se precisa de nova página
      if (yPosition > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
      }
    }
  });

  return doc.output('blob');
}; 
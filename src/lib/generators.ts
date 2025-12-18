export const generateDocumentNumber = (prefix: string = 'QT') => {
    return `${prefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}
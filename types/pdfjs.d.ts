declare module 'pdfjs-dist/build/pdf' {
  export const getDocument: any;
  export const GlobalWorkerOptions: any;
}

declare module 'pdfjs-dist/build/pdf.worker.entry' {
  const worker: any;
  export default worker;
}

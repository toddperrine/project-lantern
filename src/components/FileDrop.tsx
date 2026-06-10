'use client';

type FileDropProps = {
  id: string;
  label: string;
  description: string;
  fileName: string;
  onTextLoaded: (text: string, fileName: string) => void;
};

const acceptedTypes = ['.md', '.txt'];

export function FileDrop({ id, label, description, fileName, onTextLoaded }: FileDropProps) {
  async function handleFile(file?: File) {
    if (!file) {
      return;
    }

    const isAccepted = acceptedTypes.some((extension) => file.name.toLowerCase().endsWith(extension));
    if (!isAccepted) {
      window.alert('Please upload a .md or .txt file.');
      return;
    }

    const text = await file.text();
    onTextLoaded(text, file.name);
  }

  return (
    <div className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 shadow-2xl shadow-cyan-950/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label htmlFor={id} className="text-base font-semibold text-white">
            {label}
          </label>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">.md / .txt</span>
      </div>
      <label
        htmlFor={id}
        className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300/40 bg-slate-950/60 px-4 py-8 text-center transition hover:border-cyan-200 hover:bg-cyan-950/30"
      >
        <span className="text-sm font-semibold text-cyan-100">{fileName || 'Choose a file'}</span>
        <span className="mt-2 text-xs text-slate-500">Local only for this MVP. Files are read in your browser.</span>
      </label>
      <input id={id} type="file" accept=".md,.txt,text/plain,text/markdown" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} />
    </div>
  );
}

import { ImportProvider } from './ImportContext';

export default function ImportLayout({ children }: { children: React.ReactNode }) {
  return <ImportProvider>{children}</ImportProvider>;
}

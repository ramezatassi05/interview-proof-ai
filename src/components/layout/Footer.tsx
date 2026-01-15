import { Container } from './Container';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
      <Container>
        <div className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            InterviewProof - Know what will sink you.
          </p>
          <div className="flex gap-6 text-sm text-zinc-500 dark:text-zinc-500">
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300">
              Privacy
            </a>
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300">
              Terms
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

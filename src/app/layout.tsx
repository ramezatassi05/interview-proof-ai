import type { Metadata } from 'next';
import { Source_Serif_4, Source_Sans_3, Source_Code_Pro } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { CreditsWrapper } from '@/components/credits/CreditsWrapper';
import './globals.css';

const sourceSerif = Source_Serif_4({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

const sourceSans = Source_Sans_3({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const sourceCode = Source_Code_Pro({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'InterviewProof - Know What Will Sink You',
  description:
    'Job-specific interview diagnostic that identifies rejection risks and prioritizes fixes.',
};

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${sourceSerif.variable} ${sourceSans.variable} ${sourceCode.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider>
            <CreditsWrapper>{children}</CreditsWrapper>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

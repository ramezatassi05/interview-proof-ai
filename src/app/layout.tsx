import type { Metadata } from 'next';
import { DM_Sans, Nunito_Sans } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { CreditsWrapper } from '@/components/credits/CreditsWrapper';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const nunitoSans = Nunito_Sans({
  variable: '--font-nunito-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'InterviewProof - Know What Will Sink You',
  description:
    'Job-specific interview diagnostic that identifies rejection risks and prioritizes fixes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${nunitoSans.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <CreditsWrapper>{children}</CreditsWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

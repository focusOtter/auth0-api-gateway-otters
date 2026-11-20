import type { Metadata } from 'next';
import { Auth0Provider } from '@auth0/nextjs-auth0';
import './globals.css';

export const metadata: Metadata = { title: 'Otter Ops — Little paws. Proper permissions.', description: 'A riverside field guide to Auth0 JWT authorization on AWS API Gateway.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Auth0Provider>{children}</Auth0Provider></body></html>;
}

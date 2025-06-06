import { ReactNode } from 'react';
import { HeroUIProvider } from '@heroui/react';

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  return <HeroUIProvider>{children}</HeroUIProvider>;
};

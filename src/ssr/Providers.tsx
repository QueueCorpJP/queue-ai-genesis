import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminProvider } from "@/contexts/AdminContext";
import { TooltipProvider } from "@/components/ui/tooltip";

type ProvidersProps = {
	children: React.ReactNode;
};

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
	const queryClient = new QueryClient();
	return (
		<QueryClientProvider client={queryClient}>
			<AdminProvider>
				<TooltipProvider>
					{children}
				</TooltipProvider>
			</AdminProvider>
		</QueryClientProvider>
	);
};



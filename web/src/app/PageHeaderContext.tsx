import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface PageHeaderContextValue {
  headerContent: ReactNode;
  setHeaderContent: (content: ReactNode) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue>({
  headerContent: null,
  setHeaderContent: () => {},
});

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [headerContent, setHeaderContentState] = useState<ReactNode>(null);
  const setHeaderContent = useCallback((content: ReactNode) => {
    setHeaderContentState(content);
  }, []);

  return (
    <PageHeaderContext.Provider value={{ headerContent, setHeaderContent }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePageHeader() {
  return useContext(PageHeaderContext);
}

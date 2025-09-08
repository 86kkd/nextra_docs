import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "../../mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata(props) {
  const params = await props.params;
  
  // Skip favicon and other non-MDX requests
  if (!params.mdxPath || params.mdxPath.includes('favicon')) {
    return {};
  }
  
  try {
    const { metadata } = await importPage(params.mdxPath);
    return metadata;
  } catch (error) {
    console.error('[nextra] Error loading metadata:', error);
    return {};
  }
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props) {
  const params = await props.params;
  
  // Skip favicon and other non-MDX requests
  if (!params.mdxPath || params.mdxPath.includes('favicon')) {
    return null;
  }
  
  try {
    const result = await importPage(params.mdxPath);
    const { default: MDXContent, toc, metadata } = result;
    return (
      <Wrapper toc={toc} metadata={metadata}>
        <MDXContent {...props} params={params} />
      </Wrapper>
    );
  } catch (error) {
    console.error('[nextra] Error loading page:', error);
    return <div>Page not found</div>;
  }
}

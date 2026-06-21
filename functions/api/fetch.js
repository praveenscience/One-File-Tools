export async function onRequestGet(context) {
  const { request } = context;
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing url parameter", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }

  try {
    const parsedUrl = new URL(targetUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return new Response("Invalid URL protocol. Only http and https are supported.", {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    }

    // Use a standard browser User-Agent so we are less likely to get blocked by websites
    const headers = new Headers();
    headers.set(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OneFileTools/1.0"
    );
    headers.set(
      "Accept",
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
    );
    headers.set("Accept-Language", "en-US,en;q=0.5");

    const response = await fetch(targetUrl, {
      method: "GET",
      headers,
      redirect: "follow"
    });

    const text = await response.text();

    return new Response(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "X-Proxy-Success": "true"
      }
    });
  } catch (error) {
    return new Response(`Proxy Error: ${error.message}`, {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }
}

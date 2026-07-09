export async function onRequestGet(context) {
  const { request } = context;
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Validate that the request originates from our own domain (or localhost during dev)
  let isAllowed = true;
  if (origin) {
    try {
      isAllowed = new URL(origin).origin === requestUrl.origin;
    } catch {
      isAllowed = false;
    }
  } else if (referer) {
    try {
      isAllowed = new URL(referer).origin === requestUrl.origin;
    } catch {
      isAllowed = false;
    }
  }

  if (!isAllowed) {
    return new Response("Access Denied: This proxy is only available for requests originating from the same domain.", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }

  const { searchParams } = requestUrl;
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing url parameter", {
      status: 400,
      headers: {
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

    const responseHeaders = {
      "Content-Type": response.headers.get("content-type") || "text/html; charset=utf-8",
      "X-Proxy-Success": "true"
    };
    if (origin) {
      responseHeaders["Access-Control-Allow-Origin"] = origin;
    }

    return new Response(text, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    const responseHeaders = {
      "Content-Type": "text/plain; charset=utf-8"
    };
    if (origin) {
      responseHeaders["Access-Control-Allow-Origin"] = origin;
    }
    return new Response(`Proxy Error: ${error.message}`, {
      status: 500,
      headers: responseHeaders
    });
  }
}

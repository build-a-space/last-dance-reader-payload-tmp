import { createFileRoute } from "@tanstack/react-router";
import { NovelReader } from "../components/novel-reader";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;1,7..72,400&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <NovelReader />;
}

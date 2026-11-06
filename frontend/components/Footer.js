import { project } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>{project.college}</p>
        <p className="muted">{project.title} · Mini Project</p>
      </div>
    </footer>
  );
}

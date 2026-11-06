import Image from "next/image";
import Link from "next/link";
import {
  project, abstract, introduction, existingSystem, limitations, layers,
  proposedIntro, proposedPoints, objectives, literature, conclusion, futureScope,
} from "@/lib/content";

function Section({ id, eyebrow, title, children, alt }) {
  return (
    <section id={id} className={alt ? "section alt" : "section"}>
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      {/* HERO (slide 1) */}
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="eyebrow">{project.college}</p>
            <h1>{project.title}</h1>
            <p className="lead">{project.tagline}</p>
            <div className="cta">
              <Link href="/detect" className="btn primary">Analyze a transaction</Link>
              <Link href="/dashboard" className="btn ghost">View dashboard</Link>
            </div>
          </div>
          <div className="hero-logo">
            <Image src="/logo.png" alt="Methodist College of Engineering and Technology" width={220} height={220} priority />
          </div>
        </div>
      </section>

      {/* ABSTRACT (slide 2) */}
      <Section id="abstract" eyebrow="01" title="Abstract">
        <p className="prose">{abstract}</p>
      </Section>

      {/* INTRODUCTION (slide 3) */}
      <Section id="introduction" eyebrow="02" title="Introduction" alt>
        <div className="grid-3">
          {introduction.map((p, i) => <p key={i} className="card prose">{p}</p>)}
        </div>
      </Section>

      {/* EXISTING SYSTEM (slide 4) */}
      <Section id="existing" eyebrow="03" title="Existing System">
        <div className="grid-2">
          <div className="card">
            <h3>How it works today</h3>
            <ul className="list">{existingSystem.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div className="card danger">
            <h3>Limitations</h3>
            <ul className="list x">{limitations.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        </div>
      </Section>

      {/* ARCHITECTURE (slide 5) */}
      <Section id="architecture" eyebrow="04" title="System Architecture" alt>
        <div className="card diagram">
          <Image src="/architecture.png" alt="System architecture diagram" width={1504} height={688}
            style={{ width: "100%", height: "auto" }} />
        </div>
        <div className="grid-3 layers">
          {layers.map((l) => (
            <div key={l.n} className="card layer">
              <span className="num">{l.n}</span>
              <h4>{l.title}</h4>
              <p className="muted">{l.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* PROPOSED SOLUTION (slides 6-7) */}
      <Section id="solution" eyebrow="05" title="Proposed Solution">
        <p className="prose">{proposedIntro}</p>
        <div className="grid-4">
          {proposedPoints.map((p) => (
            <div key={p.title} className="card feature">
              <h4>{p.title}</h4>
              <p className="muted">{p.text}</p>
            </div>
          ))}
        </div>
        <div className="pills">
          {objectives.map((o) => <span key={o} className="pill">{o}</span>)}
        </div>
      </Section>

      {/* LITERATURE SURVEY (slide 8) */}
      <Section id="literature" eyebrow="06" title="Literature Survey" alt>
        <div className="table-wrap card">
          <table>
            <thead><tr><th>Index</th><th>Author</th><th>Title</th><th>Publication</th><th>Year</th></tr></thead>
            <tbody>
              {literature.map((r) => (
                <tr key={r.n}>
                  <td><strong>{r.n}</strong></td><td>{r.author}</td>
                  <td><em>{r.title}</em></td><td><em>{r.pub}</em></td><td>{r.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* CONCLUSION (slide 9) */}
      <Section id="conclusion" eyebrow="07" title="Conclusion">
        <p className="prose">{conclusion}</p>
        <h3 style={{ marginTop: 28 }}>Future enhancements</h3>
        <div className="pills">
          {futureScope.map((o) => <span key={o} className="pill">{o}</span>)}
        </div>
        <div className="cta" style={{ marginTop: 32 }}>
          <Link href="/detect" className="btn primary">Try the live demo</Link>
        </div>
      </Section>
    </>
  );
}

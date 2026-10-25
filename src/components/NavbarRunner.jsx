export function NavbarRunner() {
  return (
    <div className="nav-runner" aria-hidden="true">
      <div className="nav-runner-flip">
        <div className="nav-runner-bob">
          <span className="nav-runner-shadow" />
          <span className="nav-runner-dust nav-runner-dust-a" />
          <span className="nav-runner-dust nav-runner-dust-b" />
          <span className="nav-runner-leg nav-runner-leg-back" />
          <span className="nav-runner-leg nav-runner-leg-front" />
          <img
            className="nav-runner-sprite"
            src="/mascot/dessoir-dragon-runner.png"
            alt=""
            draggable="false"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}

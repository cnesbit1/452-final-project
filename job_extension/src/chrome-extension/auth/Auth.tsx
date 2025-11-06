import './auth.css';
interface Props{
    setPassword: (param: string) => void;
    setUsername: (param: string) => void;
    handleSubmit: (param: React.FormEvent) => void;
    username: string;
    password: string;
}

function Auth(props : Props){
    return (
    <form onSubmit={props.handleSubmit} className="form">
        <input
          type="username"
          placeholder="username"
          value={props.username}
          onChange={(e) => props.setUsername(e.target.value)}
          className="input"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={props.password}
          onChange={(e) => props.setPassword(e.target.value)}
          className="input"
          required
        />
        <button type="submit" className="button">
          Sign in
        </button>
      </form>
  );
}

export default Auth;
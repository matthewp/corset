import { createEffect, For } from "solid-js";
import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { render } from "solid-js/web";

function createLocalStore<T>(initState: T): [Store<T>, SetStoreFunction<T>] {
	const [state, setState] = createStore(initState);
	if (localStorage.todos) setState(JSON.parse(localStorage.todos));
	createEffect(() => (localStorage.todos = JSON.stringify(state)));
	return [state, setState];
}

const App = () => {
	const [state, setState] = createLocalStore({
		todos: [],
		newTitle: ""
	});
	return (
		<>
			<h3>Simple Todos Example</h3>
			<input
				type="text"
				placeholder="enter todo and click +"
				value={state.newTitle}
				onInput={(e) => setState({ newTitle: e.target.value })}
			/>
			<button
				onClick={() =>
					setState({
						todos: [
							...state.todos,
							{
								title: state.newTitle,
								done: false
							}
						],
						newTitle: ""
					})
				}
			>
				+
			</button>
			<For each={state.todos}>
				{(todo, i) => {
					const { done, title } = todo;
					return (
						<div>
							<input
								type="checkbox"
								checked={done}
								onChange={(e) =>
									setState("todos", i(), { done: e.target.checked })
								}
							/>
							<input
								type="text"
								value={title}
								onChange={(e) =>
									setState("todos", i(), { title: e.target.value })
								}
							/>
							<button
								onClick={() =>
									setState("todos", (t) => [
										...t.slice(0, i()),
										...t.slice(i() + 1)
									])
								}
							>
								x
							</button>
						</div>
					);
				}}
			</For>
		</>
	);
};

render(App, document.getElementById("app"));
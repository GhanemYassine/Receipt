import './App.css'

import axios from 'axios'
import React, { SetStateAction, useState } from 'react'

const ANALYZE_RECEIPT_URL = `${process.env.REACT_APP_BACKEND_URL}/receipts`;

interface File {
	name: string;
	src: string;
}

interface Block {
	begin_row: number;
	end_row: number;
	begin_col: number;
	end_col: number;
}

interface Blocks {
	blocks: Block[];
}

function App() {
	const [file, setFile] = useState<File>({
		name: "",
		src: "",
	});

	const [blocks, setBlocks] = useState<String[]>([]);

	console.log(blocks);
	return (
		<div className="App">
			<div className="container">
				{blocks.map((block, index) => {
					return (
						<pre
							key={index}
							style={{
								border: "red",
								borderStyle: "solid",
								borderRadius: "1px",
							}}
						>
							{block}
						</pre>
					);
				})}
				<input
					accept=".txt"
					multiple={false}
					type="file"
					id="file"
					onChange={async (e) => analyzeFile(e, setFile, setBlocks)}
				/>
				<label htmlFor="file">Analyze Receipt</label>
				<span id="filename">{file.name}</span>
			</div>
		</div>
	);
}

const analyzeFile = async (
	e: React.ChangeEvent<HTMLInputElement>,
	setFile: React.Dispatch<SetStateAction<File>>,
	setBlocks: React.Dispatch<SetStateAction<String[]>>
): Promise<void> => {
	const file = (e.target.files?.length &&
		e.target.files[0]) as globalThis.File;
	const reader = new FileReader();
	reader.onloadend = async () => {
		const src = URL.createObjectURL(file);
		const content = reader.result as string;
		setFile(() => {
			return {
				src,
				name: file.name,
			};
		});
		displayBlocks(file, content, setBlocks);
	};
	if (file) {
		reader.readAsText(file);
	}
};

const displayBlocks = async (
	file: globalThis.File,
	content: string,
	setBlocks: React.Dispatch<SetStateAction<String[]>>
) => {
	const data = new FormData();
	data.append("receipt", file);
	const analyzedBlocks = (await fetchBlocks(data)).blocks;
	let current_row = 1;
	let current_col = 1;
	let current_block = "";
	let block_index = 0;
	const toBeDisplayedBlocks: string[] = [];
	for (const character of content) {
		if (
			block_index < analyzedBlocks.length &&
			isInsideBlock(current_row, current_col, analyzedBlocks[block_index])
		) {
			current_block += character;
		} else if (
			block_index < analyzedBlocks.length &&
			current_row >= analyzedBlocks[block_index].end_row &&
			current_col > analyzedBlocks[block_index].end_col
		) {
			toBeDisplayedBlocks.push(current_block);
			current_block = "";
			block_index++;
		}
		if (character === "\n") {
			current_row++;
			current_col = 1;
		} else {
			current_col++;
		}
	}
	setBlocks(toBeDisplayedBlocks);
};

const fetchBlocks = async (data: FormData): Promise<Blocks> => {
	let res: Blocks = { blocks: [] };
	try {
		res = (await axios.post<Blocks>(ANALYZE_RECEIPT_URL, data)).data;
	} catch (err) {
		console.log(err);
	}
	return res;
};

const isInsideBlock = (
	current_row: number,
	current_col: number,
	block: Block
): boolean => {
	return (
		current_row >= block.begin_row &&
		current_col >= block.begin_col &&
		current_row <= block.end_row &&
		current_col <= block.end_col
	);
};

export default App;

import * as moment from 'moment';
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import * as gfm from 'remark-gfm';
import { IIssue } from './model';
import _ from 'lodash';

interface IIssueProps {
	vscode: any;
	host: string;
	issueData: IIssue;
}

export default class IssuePreview extends React.Component<IIssueProps> {
	constructor(props: any) {
		super(props);

		const oldState = this.props.vscode.getState();
		if (oldState) {
			this.state = oldState;
		} else {
			this.state = {}; // Get from global window
		}
	}

	private renderers = {
		code: ({ language, value }) => {
			return <SyntaxHighlighter style={a11yDark} language={language} children={value} showLineNumbers={true} />;
		},
	};

	/*
	 * Render Title Block
	 */
	private renderTitleBlock = () => {
		return (
			<div className="grid" key="title-block">
				<h1>
					<b>{this.props.issueData.idReadable}</b> {this.props.issueData.summary}
				</h1>
				<p className="text-gray-400">
					Created by{' '}
					<a href={`admin/hub/users/${this.props.issueData.reporter.login}`}>
						{this.props.issueData.reporter.fullName}
					</a>{' '}
					{moment(this.props.issueData.created).fromNow()}
				</p>
				<p className="text-gray-400">
					Updated by{' '}
					<a href={`admin/hub/users/${this.props.issueData.updater.login}`}>{this.props.issueData.updater.fullName}</a>{' '}
					{moment(this.props.issueData.updated).fromNow()}
				</p>
			</div>
		);
	};

	/*
	 * Render Custom Fields
	 */
	private renderCustomFields = () => {
		const { issueData } = this.props;

		return issueData.customFields.map((field) => {
			return (
				<div key={field.name}>
					<div>
						<b>{field.name}</b>
					</div>
					{!!field.value && !field.value.minutes ? (
						<div className="mb-3 h-6">{field.value && field.value.name ? field.value?.name : '-'}</div>
					) : (
						<div className="mb-3 h-6">{field.value && field.value.minutes ? field.value?.presentation : '-'}</div>
					)}
				</div>
			);
		});
	};

	/*
	 * Render Comments
	 */
	private renderComments = () => {
		const { issueData } = this.props;

		const comments = _.orderBy(issueData.comments, ['created'], ['desc']);

		return comments.map((comment) => {
			return (
				<div key={comment.id}>
					<div>
						<b>
							{comment.author.fullName} • Commented {moment(comment.created).fromNow()}
						</b>
					</div>
					<div className="mb-3">
						<ReactMarkdown
							renderers={this.renderers}
							plugins={[gfm]}
							children={this.transformMarkdown(comment.text)}
						></ReactMarkdown>
					</div>
				</div>
			);
		});
	};

	/*
	 * Transform Markdown
	 * Update convert markdown images to URLs from attachments
	 */
	private transformMarkdown = (markdown?: string) => {
		const { issueData, host } = this.props;
		let descriptionMarkdown = markdown ? markdown : issueData.description;

		issueData.attachments.forEach((attachment) => {
			descriptionMarkdown = descriptionMarkdown.replace(attachment.name, `${host}${attachment.url}`);
		});

		return descriptionMarkdown;
	};

	render() {
		const { issueData, vscode } = this.props;

		return (
			!!issueData && (
				<>
					<div className="mt-3">
						<button
							className="w-1/6 mr-3"
							onClick={() =>
								vscode.postMessage({
									command: 'edit',
									text: issueData.idReadable,
								})
							}
						>
							Edit Issue
						</button>
						<button
							className="w-1/6 mx-3"
							onClick={() =>
								vscode.postMessage({
									command: 'updateState',
									text: issueData.idReadable,
								})
							}
						>
							Update State
						</button>
						<button
							className="w-1/6 ml-3"
							onClick={() =>
								vscode.postMessage({
									command: 'createBranch',
									text: issueData,
								})
							}
						>
							Create Branch
						</button>
						<button
							className="w-1/6 ml-3"
							onClick={() =>
								vscode.postMessage({
									command: 'addComment',
									text: issueData.idReadable,
								})
							}
						>
							Add Comment
						</button>
					</div>
					{this.renderTitleBlock()}
					<hr className="mt-4 mb-4"></hr>
					<div className="grid grid-cols-3">
						<div className="md:col-span-2 col-span-3">
							<ReactMarkdown
								renderers={this.renderers}
								plugins={[gfm]}
								children={this.transformMarkdown()}
							></ReactMarkdown>
							<div
								className="m-3 px-8 py-2"
								style={{ backgroundColor: 'var(--vscode-breadcrumbPicker-background)', borderRadius: '8px' }}
							>
								<h3>Comments</h3>
								{this.renderComments()}
							</div>
						</div>
						<div className="md:col-span-1 col-span-3 sm:order-first xs:order-first md:order-last">
							<div
								className="mx-3 mb-3 p-8"
								style={{ backgroundColor: 'var(--vscode-breadcrumbPicker-background)', borderRadius: '8px' }}
							>
								<h3>Fields</h3>
								{this.renderCustomFields()}
							</div>
						</div>
					</div>
				</>
			)
		);
	}
}

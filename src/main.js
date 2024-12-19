const github = require('@actions/github');
const core = require('@actions/core');
const _ = require('lodash');

function generateVersionPattern(options) {
  console.debug('Generating version regex pattern');

  let majorVersion = '\\d+';
  let minorVersion = '\\d+'
  let prerelease = '(-(\\w[\\w\.]*))?';
  let pattern = `^${options.tagPrefix}(${majorVersion})\\.(${minorVersion})\\.(\\d+)${prerelease}?$`;

  console.debug(`Generated pattern: ${pattern}`);

  return new RegExp(pattern, 'm');
}

async function calculateNextVersion(previous) {
  const defaultVersion = core.getInput('default-version');
  const incrementedValue = core.getInput('incremented-value');
  const ref = core.getInput('ref');
  const commitSha = core.getInput('commit-sha');
  const defaultRef = core.getInput('default-ref');
  const tagPrefix = core.getInput('tag-prefix');
  const versionPattern = generateVersionPattern({ tagPrefix: tagPrefix });

  let semanticVersion = '';
  let major = '';
  let minor = '';
  let patch = '';

  if(!previous) {
    console.log(`No previous version tag. Using '${ defaultVersion }' as next version.`);
    //Make sure we can parse the default version
    let match = defaultVersion.match(versionPattern);
    major = match[1];
    minor = match[2];
    patch = match[3];
    semanticVersion += defaultVersion; 
  }
  else {
    console.log(`Previous version tag '${ previous.name }' found. Calculating next version.`);
    core.setOutput('previous-version', previous.name);

    major = previous.matches[1];
    minor = previous.matches[2];
    patch = previous.matches[3];

    if(incrementedValue === 'major') {
      major = parseInt(major) + 1;
      minor = 0;
      patch = 0;
    }
    else if(incrementedValue === 'minor') {
      minor = parseInt(minor) + 1;
      patch = 0;
    }
    else if(incrementedValue === 'patch') {
      patch = parseInt(patch) + 1;
    }
    else {
      console.log(`Unsupported value in 'incremented-value'. Expected values: major,minor,patch.`);
      process.exit(1);
    }

    let coreVersion = `${major}.${minor}.${patch}`;
    semanticVersion += coreVersion;
  }

  let versionTag = `${tagPrefix}${semanticVersion}`

  console.log(`Version Tag: ${versionTag}`);
  core.setOutput('version-tag', versionTag);

  console.log(`Core version: ${semanticVersion}`);
  core.setOutput('core-version', semanticVersion);

  if (ref != defaultRef) {
    //not on default branch
    let shortSha = commitSha.substring(0, 6)
    let prerelease = `-pr.${shortSha}`
    console.log(`Not on main branch. Adding '${ prerelease }' to version number.`);
    semanticVersion += `${prerelease}`;
  }

  console.log(`Semantic version: ${semanticVersion}`);
  core.setOutput('semantic-version', semanticVersion);
}

async function run() {
  const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
  const tagPrefix = core.getInput('tag-prefix');
  
  const versionPatternOptions = {
    tagPrefix: tagPrefix, 
  };

  const versionPattern = generateVersionPattern(versionPatternOptions);

  const octokit = github.getOctokit(GITHUB_TOKEN);
  const { context = {} } = github;

  let page = 1;
  let tags = [];
  
  console.log('Getting previous tags');

  while(true) {
    const response = await octokit.repos.listTags({
      owner: context.repo.owner,
      repo: context.repo.repo,
      page,
      per_page: 100
    });
    if(response.status !== 200) {
      console.err('Error in calling github api');
      process.exit(1);
    }
    tags = tags.concat(response.data);
    if(response.data.length < 100) {
      break;
    }
    page++;
  }

  let previous = _
    .chain(tags)
    .map('name')
    .filter(name => versionPattern.test(name))
    .map(name => {
      return { name: name, matches: name.match(versionPattern) };
    })
    .head()
    .value();

  await calculateNextVersion(previous);

}

run();

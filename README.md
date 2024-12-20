# semver-tags

This action is designed to be used with CI/CD pipelines that automatically increment the version of the application.

This is a fork of [SOLIDSoftworks/semver-tag](https://github.com/SOLIDSoftworks/semver-tag) which appears to be abandoned.
  I have made modifications to better support mono-repos and removes functionality I didn't need.

## Inputs

### `GITHUB_TOKEN` **required**

The github token.

### `tag-prefix`
A value prefixed to the version number when tagging the repo. 
#### Default value `''`

### `default-version`
The version number that will be used if no semver tag is found.
#### Default value `'1.0.0'`

### `incremented-value`
What value should be incremented. 
#### Allowed values `'major'|'minor'|'patch'` 
#### Default value `'patch'`

## Outputs

### `previous-version`
The previous version number.

### `version-tag`
The core version part of the semantic version.

### `semantic-version`
The calculated version number.

## Example usage
```yaml
uses: i-make-razors/semver-tags@v1
with:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN}}
  tag-prefix: 'mono-repo-project/'
  default-version: '0.0.1'
  prerelease: 'alpha'
```

const cdk = require("@aws-cdk/cdk");
const codebuild = require("@aws-cdk/aws-codebuild");
const iam = require("@aws-cdk/aws-iam");
var argv = {};

function createStatement() {
  const statement = new iam.PolicyStatement(iam.PolicyStatementEffect.Allow);
  statement
    .addAction('ecr:*')
    .addAllResources();
  return statement;
}

//stack
class CodeBuildStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    //create aws code build with webhook name
    //Important: Cloudformation did not support webhook feature for GitHubEnterpriseSource
    const gitHubEESource = new codebuild.GitHubEnterpriseSource({
      httpsCloneUrl: props.httpsCloneUrl,
      ignoreSslErrors: true
    });
    const codebuildProject = new codebuild.Project(this, props.gitRepo + '_build', {
      source: gitHubEESource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_DOCKER_18_09_0,
        privileged: true,
        environmentVariables: {
          "AWS_ACCOUNT_ID": {
            value: props.deploy_account.toString(),
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT
          }
        }
      }
    });
    codebuildProject.role.addToPolicy(createStatement());
  }
}

//app
class codeApp extends cdk.App {
  constructor(argv) {
    super(argv);
    // stack for codebuild
    argv.gitRepo = this.node.getContext("gitRepo");
    argv.httpsCloneUrl = this.node.getContext("httpsCloneUrl");
    argv.deploy_account = this.node.getContext("deploy_account");
    this.codeBuildStack = new CodeBuildStack(this, 'gitee-' + argv.gitRepo, argv);
  };
}

new codeApp(argv).run();
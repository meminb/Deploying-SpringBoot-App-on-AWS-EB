import * as cdk from '@aws-cdk/core';
import * as elasticbeanstalk from '@aws-cdk/aws-elasticbeanstalk';
import * as s3assets from '@aws-cdk/aws-s3-assets'
import * as iam from '@aws-cdk/aws-iam';

export class CdkDeploymentStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appName ="EBS-Demo"
 
    const app = new elasticbeanstalk.CfnApplication(this, 'Application', {
      applicationName: `${appName}-EB-App`
    });

    const apiZipped = new s3assets.Asset(this, 'Zipped-Spring-App',{
      path:`${__dirname}/../../SpringApp/target/SpringApp-0.0.1-SNAPSHOT.zip`,
    })
    
  
    const appVersionProps = new elasticbeanstalk.CfnApplicationVersion(this, 'Version-1.0', {
      applicationName: `${appName}-EB-App`,
      sourceBundle: {
        s3Bucket: apiZipped.s3BucketName,
        s3Key: apiZipped.s3ObjectKey,
      },
    });

    appVersionProps.addDependsOn(app);

    const EbInstanceRole = new iam.Role(this, `${appName}-aws-elasticbeanstalk-ec2-role`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    const managedPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier')

    EbInstanceRole.addManagedPolicy(managedPolicy);
    
    const profileName = `${appName}-EbsDemoProfile`
    
    const instanceProfile = new iam.CfnInstanceProfile(this, profileName, {
      
      instanceProfileName: profileName,
      roles: [
        EbInstanceRole.roleName
      ]
    });
    const optionSettingProperties: elasticbeanstalk.CfnEnvironment.OptionSettingProperty[] = [
      
      {
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'InstanceType',
        value: 't3.small',
      },
    
      {
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'IamInstanceProfile',
        value: profileName
      },
    
      {
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'IamInstanceProfile',
        value: instanceProfile.attrArn,
    }
    
    ];
    
        
        const ebs_env = new elasticbeanstalk.CfnEnvironment(this, 'Environmentm', {
    
          environmentName: `${appName}-EB-Env`,
          applicationName:  `${appName}-EB-App`,
          solutionStackName: '64bit Amazon Linux 2 v3.2.7 running Corretto 8',
          optionSettings: optionSettingProperties,
          versionLabel: appVersionProps.ref,
        });
        
        ebs_env.addDependsOn(app);
        
      }
}
